import { toString } from "qrcode";

export async function qrSvg(value: string): Promise<string> {
  return toString(value, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 2,
    width: 176,
    color: {
      dark: "#000000ff",
      light: "#ffffffff",
    },
  });
}
