export interface InformacionNegocio {
  nombreLegal: string;
  nombreComercial: string;
  telefono: string;
  correoElectronico: string;
}

export interface DireccionNegocio {
  lineaDireccion1: string;
  lineaDireccion2: string;
  ciudad: string;
  estadoProvincia: string;
  codigoPostal: string;
}

export interface BrandingPortal {
  logoModoClaro: string;
  logoModoOscuro: string;
  faviconPortal: string;
  tituloPortal: string;
  pieCorreosElectronicos: string;
}

export interface ConfiguracionesData {
  informacionNegocio: InformacionNegocio;
  direccionNegocio: DireccionNegocio;
  brandingPortal: BrandingPortal;
}