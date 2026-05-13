import {
    Alignment,
    Button,
    Classes,
    Colors,
    Dialog,
    Divider,
    FormGroup,
    Icon,
    InputGroup,
    Intent,
    Navbar,
    NavbarGroup,
    Position,
    Radio,
    RadioGroup,
    Switch,
    TextArea,
    Toaster,
} from '@blueprintjs/core';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import styles from './App.module.scss';
import {Layer, Rect, Stage} from 'react-konva';
import {__, convertSettingsToTemplateDocument} from './utils';
import {
    ElementPosition,
    FooterLayout,
    HeaderTitleBoxPosition,
    Settings,
    TicketInfoBoxLayout,
    TicketPageFormat,
} from './model/settings';
import CanvasRenderer from './components/CanvasRenderer';
import {
    getTicketSettings,
    getTicketStatuses,
    saveTicketTemplateDocument,
    setTicketSettings,
    setTicketStatus,
} from './api';
import {Controller, useForm} from 'react-hook-form';
import {ColorPicker} from './components/ColorPicker';
import {MediaImagePicker} from './components/MediaImagePicker';
import ElementPickerFactory from './components/ElementPicker';

enum SettingsTab {
    HEADER,
    CONTENT,
    FOOTER,
    ACCESSIBILITY
}

const MM_TO_PX = 96 / 25.4;

type SettingsId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

const templates: SettingsId[] = [1, 2, 3, 4, 5, 6, 7, 8];

const TemplatePicker = ElementPickerFactory<SettingsId, SettingsId>();

const App: React.FC = () => {
    const [ticketStatuses, setTicketStatuses] = useState<Record<
        SettingsId,
        boolean
    > | null>(null);
    const [activeTab, setActiveTab] = useState<SettingsTab>(SettingsTab.HEADER);
    const [scale, setScale] = useState<number>(0.5);
    const [loading, setLoading] = useState<boolean>(true);
    const [settingsId, setSettingsId] = useState<SettingsId>(1);
    const [[canvasWidth, canvasHeight], setCanvasSize] = useState<
        [number, number]
    >([0, 0]);
    const [pendingSettingsId, setPendingSettingsId] = useState<SettingsId | null>(
        null
    );
    const canvasContainerRef = useRef<HTMLDivElement>(null);
    const toasterRef = useRef<Toaster>(null);

    const {
        register,
        control,
        handleSubmit,
        watch,
        setValue,
        getValues,
        formState,
        reset,
    } = useForm<Settings>({
        shouldUnregister: false,
    });

    // Handle canvas sizing and resizing.
    useEffect(() => {
        const setSize = () => {
            if (canvasContainerRef.current) {
                const canvasEl = canvasContainerRef.current;
                setTimeout(() => setCanvasSize([canvasEl.offsetWidth, canvasEl.offsetHeight]), 2000);
            }
        };
        window.addEventListener('resize', setSize);
        setSize();
        return () => {
            window.removeEventListener('resize', setSize);
        };
    }, []);

    // Load data settings from server.
    useEffect(() => {
        setLoading(true);
        getTicketSettings(settingsId)
            .then((settings) => {
                reset(settings);
                if (!ticketStatuses) {
                    return getTicketStatuses().then((statuses) => {
                        setTicketStatuses(statuses);
                    });
                }
            })
            .catch(() => {
                const toaster = toasterRef.current;
                if (toaster) {
                    toaster.show({
                        icon: 'error',
                        message: __(
                            'Design template could not be loaded.',
                            'eccospro-easyticket'
                        ),
                        timeout: 5000,
                        intent: Intent.WARNING,
                    });
                }
            })
            .finally(() => {
                setLoading(false);
            });
    }, [reset, settingsId]);

    // Handle form field registration.
    useEffect(() => {
        if (activeTab === SettingsTab.HEADER) {
            register('pageFormat');
            register('customPageWidth', {
                setValueAs: (v) => Number(v) || 0,
            });
            register('customPageHeight', {
                setValueAs: (v) => Number(v) || 0,
            });
            register('elementPositions');
            register('headerImageData', {
                setValueAs: (v) => (v && String(v)) || null,
            });
            register('headerTitleBoxPosition', {
                required: true,
                setValueAs: (v) => v && Number(v),
            });
        } else if (activeTab === SettingsTab.CONTENT) {
            register('ticketInfoBoxLayout', {
                required: true,
                setValueAs: (v) => v && Number(v),
            });
        } else if (activeTab === SettingsTab.FOOTER) {
            register('footerLayout', {
                required: true,
                setValueAs: (v) => v && Number(v),
            });
            register('logoImageData', {
                setValueAs: (v) => (v && String(v)),
            });
        }
    }, [activeTab, register]);

    const zoomIn = useCallback(() => {
        setScale((scale) => Math.round((scale + 0.1) * 10) / 10);
    }, []);

    const zoomOut = useCallback(() => {
        setScale((scale) => Math.round((scale - 0.1) * 10) / 10);
    }, []);

    const handleShowHeaderTab = useCallback(() => {
        setActiveTab(SettingsTab.HEADER);
    }, []);

    const handleShowContentTab = useCallback(() => {
        setActiveTab(SettingsTab.CONTENT);
    }, []);

    const handleShowFooterTab = useCallback(() => {
        setActiveTab(SettingsTab.FOOTER);
    }, []);

    const handleShowAccessibilityTab = useCallback(() => {
        setActiveTab(SettingsTab.ACCESSIBILITY);
    }, []);

    const handleChangeSettingsId = useCallback(
        (value: SettingsId): void => {
            if (loading) {
                return;
            }
            const settingsId = value || 1;
            // Warn user that changes are going to be lost.
            if (formState.isDirty) {
                setPendingSettingsId(settingsId);
            } else {
                setSettingsId(settingsId);
            }
        },
        [loading, formState.isDirty]
    );

    const getSettingsId = useCallback((e: SettingsId) => e, []);

    const handleStatusChange = useCallback(
        (event: React.FormEvent<HTMLInputElement>, e: SettingsId) => {
            const checked = event.currentTarget.checked;
            setLoading(true);
            setTicketStatus(e, checked)
                .then((success) => {
                    if (success) {
                        setTicketStatuses((statuses) =>
                            Object.assign({}, statuses, {[e]: checked})
                        );
                    } else {
                        // Try open the new template.
                        setTimeout(() => {
                            // Warn user that changes are going to be lost.
                            if (formState.isDirty) {
                                setPendingSettingsId(e);
                            } else {
                                setSettingsId(e);
                            }
                        }, 500);
                        const toaster = toasterRef.current;
                        if (toaster) {
                            toaster.show({
                                icon: 'info-sign',
                                message: __(
                                    'Design template does not exist, opening template for initial setup.',
                                    'eccospro-easyticket'
                                ),
                                timeout: 5000,
                                intent: Intent.WARNING,
                            });
                        }
                    }
                })
                .catch(() => {
                    const toaster = toasterRef.current;
                    if (toaster) {
                        toaster.show({
                            icon: 'error',
                            message: __(
                                'Design template status could not be changed.',
                                'eccospro-easyticket'
                            ),
                            timeout: 5000,
                            intent: Intent.WARNING,
                        });
                    }
                })
                .finally(() => {
                    setLoading(false);
                });
        },
        [formState.isDirty]
    );

    const handleElementPositionChange = useCallback(
        (id: string, x: number, y: number) => {
            const elementPositions = {...(getValues('elementPositions') || {})};
            elementPositions[id] = {x, y} as ElementPosition;
            setValue('elementPositions', elementPositions, {
                shouldDirty: true,
            });
        },
        [getValues, setValue]
    );

    const renderSettingsListItem = useCallback(
        (e: SettingsId) => {
            const checked = Boolean(ticketStatuses && ticketStatuses[e]);
            return {
                text: __('Template', 'eccospro-easyticket') + ' ' + e,
                label: (
                    <div
                        onClick={(e) => {
                            e.stopPropagation();
                        }}
                    >
                        <Switch
                            checked={checked}
                            onChange={(event) => handleStatusChange(event, e)}
                            disabled={e === settingsId}
                            className={
                                styles.menuItemSwitch + ' ' + Classes.POPOVER_DISMISS_OVERRIDE
                            }
                            alignIndicator={Alignment.RIGHT}
                        />
                    </div>
                ),
            };
        },
        [ticketStatuses, settingsId]
    );

    const previewSettingsItem = useCallback((e: SettingsId) => {
        return __('Template', 'eccospro-easyticket') + ' ' + e;
    }, []);

    const handleSaveSettings = useCallback(
        async (settings: Settings) => {
            setLoading(true);
            try {
                console.log('saving....');
                await setTicketSettings(settingsId, settings);
                const doc = convertSettingsToTemplateDocument(settings);
                alert('PDF_JSON:' + JSON.stringify(doc, null, 2));
                await saveTicketTemplateDocument(settingsId, doc);
                const statuses = await getTicketStatuses();
                setTicketStatuses(statuses);
                if (toasterRef.current) {
                    toasterRef.current.show({
                        icon: 'tick-circle',
                        message: __('Design successfully saved.', 'eccospro-easyticket'),
                        timeout: 5000,
                        intent: Intent.SUCCESS,
                    });
                }
            } catch (e) {
            }
            setLoading(false);
        },
        [settingsId]
    );

    const saveChanges = handleSubmit(handleSaveSettings);

    const closeConfirmDiscardChangesDialog = useCallback(() => {
        setPendingSettingsId(null);
    }, []);

    const discardChanges = useCallback(() => {
        if (pendingSettingsId) {
            setSettingsId(pendingSettingsId);
        }
        setPendingSettingsId(null);
    }, [pendingSettingsId]);

    const saveChangesAndContinue = useCallback(async () => {
        if (pendingSettingsId) {
            await saveChanges();
            setSettingsId(pendingSettingsId);
        }
        setPendingSettingsId(null);
    }, [saveChanges, pendingSettingsId]);

    const watchedSettings = watch();

    let options = null;
    switch (activeTab) {
        case SettingsTab.HEADER:
            options = (
                <>
                    <FormGroup
                        label={__('Paper size', 'eccospro-easyticket')}
                    >
                        <Controller
                            name="pageFormat"
                            control={control}
                            render={({onChange, value, ref}) => (
                                <RadioGroup
                                    selectedValue={value || TicketPageFormat.A4}
                                    onChange={onChange}
                                    ref={ref}
                                >
                                    <Radio
                                        label={__('A4', 'eccospro-easyticket')}
                                        value={TicketPageFormat.A4}
                                    />
                                    <Radio
                                        label={__('A5', 'eccospro-easyticket')}
                                        value={TicketPageFormat.A5}
                                    />
                                    <Radio
                                        label={__('Custom size', 'eccospro-easyticket')}
                                        value={TicketPageFormat.CUSTOM}
                                    />
                                </RadioGroup>
                            )}
                        />
                    </FormGroup>
                    {watchedSettings.pageFormat === TicketPageFormat.CUSTOM ? (
                        <>
                            <FormGroup
                                label={__('Custom width (mm)', 'eccospro-easyticket')}
                            >
                                <InputGroup
                                    name="customPageWidth"
                                    type="number"
                                    min={10}
                                    inputRef={register({required: true, min: 10})}
                                />
                            </FormGroup>
                            <FormGroup
                                label={__('Custom height (mm)', 'eccospro-easyticket')}
                            >
                                <InputGroup
                                    name="customPageHeight"
                                    type="number"
                                    min={10}
                                    inputRef={register({required: true, min: 10})}
                                />
                            </FormGroup>
                        </>
                    ) : null}
                    <FormGroup
                        label={__('Header image', 'eccospro-easyticket')}
                        helperText={__('Only the following formats are supported: PNG, JPG, GIF, WEBP', 'eccospro-reserve')}
                    >
                        <Controller
                            control={control}
                            name="headerImageData"
                            render={({onChange, value}) => (
                                <MediaImagePicker
                                    value={(value && String(value)) || null}
                                    onChange={onChange}
                                    buttonText={__('Select image', 'eccospro-easyticket')}
                                />
                            )}
                        />
                    </FormGroup>
                    <FormGroup
                        label={__('Header title position', 'eccospro-easyticket')}
                    >
                        <Controller
                            name="headerTitleBoxPosition"
                            control={control}
                            render={({onChange, value, ref}) => (
                                <RadioGroup
                                    selectedValue={value && Number(value)}
                                    onChange={onChange}
                                    ref={ref}
                                >
                                    <Radio
                                        label={__('Overlap header image', 'eccospro-easyticket')}
                                        value={HeaderTitleBoxPosition.OVERLAP_HEADER_IMAGE}
                                    />
                                    <Radio
                                        label={__('Below header image', 'eccospro-easyticket')}
                                        value={HeaderTitleBoxPosition.BELOW_HEADER_IMAGE}
                                    />
                                </RadioGroup>
                            )}
                        />
                    </FormGroup>
                    <FormGroup
                        label={__('Header title text color', 'eccospro-easyticket')}
                    >
                        <Controller
                            control={control}
                            name="headerTitleBoxTextColor"
                            render={({onChange, value}) => (
                                <ColorPicker onChange={onChange} value={value}/>
                            )}
                        />
                    </FormGroup>
                    <FormGroup
                        label={__(
                            'Header title background color',
                            'eccospro-easyticket'
                        )}
                    >
                        <Controller
                            control={control}
                            name="headerTitleBoxBackgroundColor"
                            render={({onChange, value}) => (
                                <ColorPicker
                                    onChange={onChange}
                                    value={value}
                                    allowTransparent
                                />
                            )}
                        />
                    </FormGroup>
                    <FormGroup label={__('Header title', 'eccospro-easyticket')}>
                        <InputGroup
                            name="headerTitle"
                            inputRef={register({required: true})}
                        />
                    </FormGroup>
                    <FormGroup label={__('Header subtitle', 'eccospro-easyticket')}>
                        <InputGroup
                            name="headerSubtitle"
                            inputRef={register({required: true})}
                        />
                    </FormGroup>
                </>
            );
            break;
        case SettingsTab.CONTENT:
            options = (
                <>
                    <FormGroup label={__('Text color', 'eccospro-easyticket')}>
                        <Controller
                            control={control}
                            name="ticketTextBoxTextColor"
                            render={({onChange, value}) => (
                                <ColorPicker onChange={onChange} value={value}/>
                            )}
                        />
                    </FormGroup>
                    <FormGroup
                        label={__('Text background color', 'eccospro-easyticket')}
                    >
                        <Controller
                            control={control}
                            name="ticketTextBoxBackgroundColor"
                            render={({onChange, value}) => (
                                <ColorPicker
                                    onChange={onChange}
                                    value={value}
                                    allowTransparent
                                />
                            )}
                        />
                    </FormGroup>
                    <FormGroup label={__('Ticket text', 'eccospro-easyticket')}>
                        <TextArea
                            growVertically={true}
                            large
                            fill
                            name="ticketText"
                            inputRef={register}
                        />
                    </FormGroup>
                    <FormGroup label={__('Code position', 'eccospro-easyticket')}>
                        <Controller
                            name="ticketInfoBoxLayout"
                            control={control}
                            render={({onChange, value, ref}) => (
                                <RadioGroup
                                    selectedValue={value && Number(value)}
                                    onChange={onChange}
                                    ref={ref}
                                >
                                    <Radio
                                        label={__('Code left', 'eccospro-easyticket')}
                                        value={TicketInfoBoxLayout.CODE_LEFT}
                                    />
                                    <Radio
                                        label={__('Code right', 'eccospro-easyticket')}
                                        value={TicketInfoBoxLayout.CODE_RIGHT}
                                    />
                                </RadioGroup>
                            )}
                        />
                    </FormGroup>
                </>
            );
            break;
        case SettingsTab.FOOTER:
            options = (
                <>
                    <FormGroup label={__('Footer layout', 'eccospro-easyticket')}>
                        <Controller
                            control={control}
                            name="footerLayout"
                            render={({onChange, value}) => (
                                <RadioGroup
                                    onChange={onChange}
                                    selectedValue={value && Number(value)}
                                >
                                    <Radio value={FooterLayout.ADDRESS_LEFT_LOGO_RIGHT}>
                                        {__('Address left, logo right', 'eccospro-easyticket')}
                                    </Radio>
                                    <Radio value={FooterLayout.ADDRESS_RIGHT_LOGO_LEFT}>
                                        {__('Address right, logo left', 'eccospro-easyticket')}
                                    </Radio>
                                </RadioGroup>
                            )}
                        />
                    </FormGroup>
                    <FormGroup label={__('Address', 'eccospro-easyticket')}>
                        <TextArea
                            growVertically={true}
                            large
                            fill
                            name="address"
                            inputRef={register}
                        />
                    </FormGroup>
                    <FormGroup
                        label={__('Logo image', 'eccospro-easyticket')}
                        helperText={__('Only the following formats are supported: PNG, JPG, GIF, WEBP', 'eccospro-reserve')}
                    >
                        <Controller
                            control={control}
                            name="logoImageData"
                            render={({onChange, value}) => (
                                <MediaImagePicker
                                    value={(value && String(value)) || null}
                                    onChange={onChange}
                                    buttonText={__('Select image', 'eccospro-easyticket')}
                                />
                            )}
                        />
                    </FormGroup>
                    <FormGroup label={__('Legal text', 'eccospro-easyticket')}>
                        <InputGroup name="legalText" inputRef={register}/>
                    </FormGroup>
                </>
            );
            break;
        case SettingsTab.ACCESSIBILITY:
            options = (
                <>
                    <FormGroup label={__('Alt text', 'eccospro-easyticket')}>
                        <TextArea
                            growVertically={true}
                            large
                            fill
                            name="ticketAltText"
                            inputRef={register}
                        />
                    </FormGroup>
                </>
            );
            break;
    }
    const optionsForm = <form>{options}</form>;

    const doc =
        !loading && watchedSettings
            ? convertSettingsToTemplateDocument(watchedSettings)
            : null;
    const docWidth = MM_TO_PX * (doc?.width || 210);
    const docHeight = MM_TO_PX * (doc?.height || 297);
    return (
        <>
            <div className={styles.container}>
                <div className={styles.menuPane}>
                    <button
                        onClick={handleShowHeaderTab}
                        className={activeTab === SettingsTab.HEADER ? styles.open : ''}
                    >
                        <Icon icon="widget-header"/>
                        {__('Header', 'eccospro-easyticket')}
                    </button>
                    <button
                        onClick={handleShowContentTab}
                        className={activeTab === SettingsTab.CONTENT ? styles.open : ''}
                    >
                        <Icon icon="widget"/>
                        {__('Content', 'eccospro-easyticket')}
                    </button>
                    <button
                        onClick={handleShowFooterTab}
                        className={activeTab === SettingsTab.FOOTER ? styles.open : ''}
                    >
                        <Icon icon="widget-footer"/>
                        {__('Footer', 'eccospro-easyticket')}
                    </button>
                    <button
                        onClick={handleShowAccessibilityTab}
                        className={activeTab === SettingsTab.ACCESSIBILITY ? styles.open : ''}
                    >
                        <Icon icon="eye-open"/>
                        {__("Accessibility", 'eccospro-easyticket')}
                    </button>
                </div>
                <div className={styles.settingsPane}>
                    <Navbar className={styles.settingsNavbar}>
                        <NavbarGroup align={Alignment.LEFT}>
                            <TemplatePicker
                                value={settingsId}
                                onChange={handleChangeSettingsId}
                                options={templates}
                                renderListItem={renderSettingsListItem}
                                previewItem={previewSettingsItem}
                                disabled={loading}
                                getId={getSettingsId}
                            />
                            <Divider/>
                            <Controller
                                control={control}
                                name="active"
                                render={({onChange, value}) => (
                                    <Switch
                                        inline
                                        alignIndicator={Alignment.RIGHT}
                                        checked={value}
                                        onChange={onChange}
                                        label={__('Active', 'eccospro-easyticket')}
                                        className={styles.activeSwitch}
                                    />
                                )}
                            />
                            <Divider/>
                            <Button
                                className={Classes.INTENT_PRIMARY}
                                icon="floppy-disk"
                                loading={loading}
                                onClick={saveChanges}
                            >
                                {__('Save', 'eccospro-easyticket')}
                            </Button>
                        </NavbarGroup>
                    </Navbar>
                    <div className={styles.settingsContainer}>{optionsForm}</div>
                </div>
                <div className={styles.previewPane}>
                    <Navbar>
                        <NavbarGroup align={Alignment.LEFT}>
                            <Button
                                className={Classes.MINIMAL}
                                icon="zoom-in"
                                onClick={zoomIn}
                            >
                                Zoom in
                            </Button>
                            <Button
                                className={Classes.MINIMAL}
                                icon="zoom-out"
                                onClick={zoomOut}
                            >
                                Zoom out
                            </Button>
                        </NavbarGroup>
                    </Navbar>
                    <div className={styles.canvas} ref={canvasContainerRef}>
                        <Stage width={canvasWidth} height={canvasHeight}>
                            <Layer>
                                <Rect
                                    fill={Colors.GRAY5}
                                    opacity={0.5}
                                    width={canvasWidth}
                                    height={canvasHeight}
                                />
                            </Layer>
                            <Layer draggable scaleX={scale} scaleY={scale}>
                                <Rect
                                    fill={'white'}
                                    width={docWidth}
                                    height={docHeight}
                                    shadowEnabled
                                    shadowBlur={10 * MM_TO_PX}
                                    shadowOpacity={0.5}
                                />
                                <CanvasRenderer
                                    templateDocument={doc}
                                    onElementPositionChange={handleElementPositionChange}
                                />
                            </Layer>
                        </Stage>
                    </div>
                </div>
            </div>
            <Toaster
                className={styles.toaster}
                position={Position.TOP_LEFT}
                canEscapeKeyClear
                autoFocus={false}
                ref={toasterRef}
                usePortal={false}
            />
            <Dialog
                isOpen={pendingSettingsId !== null}
                icon="confirm"
                onClose={closeConfirmDiscardChangesDialog}
                title={__('Confirm discard changes', 'eccospro-easyticket')}
            >
                <div className={Classes.DIALOG_BODY}>
                    {__(
                        'If you continue without saving your changes will be lost. Are you sure?',
                        'eccospro-easyticket'
                    )}
                </div>
                <div className={Classes.DIALOG_FOOTER}>
                    <div className={Classes.DIALOG_FOOTER_ACTIONS}>
                        <Button
                            onClick={closeConfirmDiscardChangesDialog}
                            disabled={loading}
                        >
                            {__('Cancel', 'eccospro-easyticket')}
                        </Button>
                        <Button
                            onClick={discardChanges}
                            intent={Intent.DANGER}
                            disabled={loading}
                        >
                            {__('Confirm', 'eccospro-easyticket')}
                        </Button>
                        {Object.keys(formState.errors).length === 0 ? (
                            <Button
                                onClick={saveChangesAndContinue}
                                intent={Intent.SUCCESS}
                                loading={loading}
                            >
                                {__('Save and continue', 'eccospro-easyticket')}
                            </Button>
                        ) : null}
                    </div>
                </div>
            </Dialog>
        </>
    );
};

export default App;
