interface Window {
  MF_VE_OBJ: PluginObject;
}

interface PluginObject {
  apiRoot: string;
  nonce: string;
  translations: Record<string, string>;
  statuses: Record<number, boolean>;
  settings: any;
}
