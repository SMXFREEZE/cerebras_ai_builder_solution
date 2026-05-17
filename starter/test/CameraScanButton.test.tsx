import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CameraScanButton } from "@/components/CameraScanButton";

const scannerMock = vi.hoisted(() => {
  const stop = vi.fn();
  const decodeFromConstraints = vi.fn();
  const BrowserMultiFormatReader = vi.fn(function (this: {
    decodeFromConstraints: typeof decodeFromConstraints;
  }) {
    this.decodeFromConstraints = decodeFromConstraints;
  });

  return { BrowserMultiFormatReader, decodeFromConstraints, stop };
});

vi.mock("@zxing/browser", () => ({
  BrowserMultiFormatReader: scannerMock.BrowserMultiFormatReader,
}));

vi.mock("@zxing/library", () => ({
  BarcodeFormat: {
    CODE_39: "CODE_39",
    CODE_93: "CODE_93",
    CODE_128: "CODE_128",
    DATA_MATRIX: "DATA_MATRIX",
    ITF: "ITF",
    PDF_417: "PDF_417",
    QR_CODE: "QR_CODE",
  },
  DecodeHintType: {
    POSSIBLE_FORMATS: "POSSIBLE_FORMATS",
  },
}));

const originalMediaDevices = navigator.mediaDevices;

describe("<CameraScanButton>", () => {
  afterEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: originalMediaDevices,
    });
  });

  it("opens the camera modal and falls back cleanly when browser camera APIs are unavailable", async () => {
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: undefined,
    });

    const onScan = vi.fn();
    render(<CameraScanButton onScan={onScan} />);

    fireEvent.click(
      screen.getByRole("button", { name: /open camera scanner/i }),
    );

    expect(screen.getByText("Camera scanner")).toBeInTheDocument();
    expect(screen.getByText("Scan code")).toBeInTheDocument();
    expect(
      await screen.findByText(
        "Camera scanning needs a browser with camera access. The scanner input is ready.",
      ),
    ).toBeInTheDocument();
    expect(onScan).not.toHaveBeenCalled();
  });

  it("closes the camera modal without submitting a scan", () => {
    const onScan = vi.fn();
    render(<CameraScanButton onScan={onScan} />);

    fireEvent.click(
      screen.getByRole("button", { name: /open camera scanner/i }),
    );
    fireEvent.click(screen.getByRole("button", { name: /close/i }));

    expect(screen.queryByText("Camera scanner")).not.toBeInTheDocument();
    expect(onScan).not.toHaveBeenCalled();
  });

  it("passes a decoded manufacturing barcode value into the scan workflow", async () => {
    scannerMock.decodeFromConstraints.mockImplementation(
      async (
        _constraints: unknown,
        _video: unknown,
        callback: (
          result: { getText: () => string },
          error: undefined,
          controls: { stop: () => void },
        ) => void,
      ) => {
        callback({ getText: () => "  C0000901  " }, undefined, {
          stop: scannerMock.stop,
        });
        return { stop: scannerMock.stop };
      },
    );
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia: vi.fn() },
    });

    const onScan = vi.fn();
    render(<CameraScanButton onScan={onScan} />);

    fireEvent.click(
      screen.getByRole("button", { name: /open camera scanner/i }),
    );

    await waitFor(() => expect(onScan).toHaveBeenCalledWith("C0000901"));
    expect(scannerMock.BrowserMultiFormatReader).toHaveBeenCalledOnce();
    const [[hints]] = scannerMock.BrowserMultiFormatReader.mock
      .calls as unknown as [[Map<string, string[]>]];
    expect(hints.get("POSSIBLE_FORMATS")).toEqual([
      "QR_CODE",
      "CODE_128",
      "DATA_MATRIX",
      "PDF_417",
      "CODE_39",
      "CODE_93",
      "ITF",
    ]);
    expect(scannerMock.stop).toHaveBeenCalled();
  });
});
