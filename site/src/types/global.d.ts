export {};

declare global {
  interface Window {
    __nivara?: {
      sigilProgress?: number;
      sigilIsActive?: boolean;
      sigilSvgUrl?: string;
    };
  }
}
