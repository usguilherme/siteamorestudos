declare module "pdfjs-dist/legacy/build/pdf.js" {
  export const version: string;
  export const GlobalWorkerOptions: { workerSrc: string };
  export function getDocument(src: { data: ArrayBuffer }): {
    promise: Promise<{
      numPages: number;
      getPage(n: number): Promise<{
        getTextContent(): Promise<{ items: Array<{ str: string; transform: number[] }> }>;
      }>;
    }>;
  };
}
