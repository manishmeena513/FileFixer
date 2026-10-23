import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { toDMS } from "../src/lib/image/metadata";
import { fileToArrayBuffer } from "../src/lib/file-utils";

describe("Milestone 3 Iteration 2: Deep Adversarial Verification", () => {
  // =========================================================================
  // 1. toDMS Coordinate and Cardinal Direction Rigorous Stress Testing
  // =========================================================================
  describe("toDMS Cardinal Direction & Boundary Verification", () => {
    it("handles zero degrees strictly: (0, true) -> 'N', (0, false) -> 'E'", () => {
      const latZero = toDMS(0, true);
      assert.strictEqual(latZero, "0° 0' 0\" N");

      const lonZero = toDMS(0, false);
      assert.strictEqual(lonZero, "0° 0' 0\" E");

      // Floating zero negative edge cases
      const latNegZero = toDMS(-0, true);
      assert.strictEqual(latNegZero, "0° 0' 0\" N");

      const lonNegZero = toDMS(-0, false);
      assert.strictEqual(lonNegZero, "0° 0' 0\" E");
    });

    it("maps positive latitudes to 'N' across boundaries and fractional values", () => {
      const northPole = toDMS(90, true);
      assert.strictEqual(northPole, "90° 0' 0\" N");

      const highNorth = toDMS(89.9999, true);
      assert.match(highNorth, /^89° 59' 59" N$/);

      const midNorth = toDMS(45.5, true);
      assert.strictEqual(midNorth, "45° 30' 0\" N");

      const nyc = toDMS(40.7128, true);
      assert.strictEqual(nyc, "40° 42' 46\" N");

      const tinyNorth = toDMS(0.0001, true);
      assert.strictEqual(tinyNorth, "0° 0' 0\" N");
    });

    it("maps negative latitudes to 'S' across boundaries and fractional values", () => {
      const southPole = toDMS(-90, true);
      assert.strictEqual(southPole, "90° 0' 0\" S");

      const highSouth = toDMS(-89.9999, true);
      assert.match(highSouth, /^89° 59' 59" S$/);

      const midSouth = toDMS(-45.5, true);
      assert.strictEqual(midSouth, "45° 30' 0\" S");

      const sydneyLat = toDMS(-33.8688, true);
      assert.strictEqual(sydneyLat, "33° 52' 7\" S");

      const tinySouth = toDMS(-0.0001, true);
      assert.strictEqual(tinySouth, "0° 0' 0\" S");
    });

    it("maps positive longitudes to 'E' across boundaries and fractional values", () => {
      const antimeridianEast = toDMS(180, false);
      assert.strictEqual(antimeridianEast, "180° 0' 0\" E");

      const highEast = toDMS(179.9999, false);
      assert.match(highEast, /^179° 59' 59" E$/);

      const delhiLon = toDMS(77.209, false);
      assert.strictEqual(delhiLon, "77° 12' 32\" E");

      const tokyoLon = toDMS(139.6917, false);
      assert.strictEqual(tokyoLon, "139° 41' 30\" E");

      const tinyEast = toDMS(0.0001, false);
      assert.strictEqual(tinyEast, "0° 0' 0\" E");
    });

    it("maps negative longitudes to 'W' across boundaries and fractional values", () => {
      const antimeridianWest = toDMS(-180, false);
      assert.strictEqual(antimeridianWest, "180° 0' 0\" W");

      const highWest = toDMS(-179.9999, false);
      assert.match(highWest, /^179° 59' 59" W$/);

      const sfLon = toDMS(-122.4194, false);
      assert.strictEqual(sfLon, "122° 25' 9\" W");

      const nycLon = toDMS(-74.006, false);
      assert.strictEqual(nycLon, "74° 0' 21\" W");

      const tinyWest = toDMS(-0.0001, false);
      assert.strictEqual(tinyWest, "0° 0' 0\" W");
    });

    it("verifies minutes and seconds remain within [0, 59] for 1,000 randomized coordinates", () => {
      for (let i = 0; i < 1000; i++) {
        const isLat = i % 2 === 0;
        const max = isLat ? 90 : 180;
        const deg = (Math.random() * 2 - 1) * max;
        const dms = toDMS(deg, isLat);

        const match = dms.match(/^(\d+)°\s+(\d+)'\s+(\d+)"\s+([NSEW])$/);
        assert.ok(match, `Invalid DMS format: "${dms}" for input ${deg}`);

        const [, dStr, mStr, sStr, dir] = match;
        const d = parseInt(dStr, 10);
        const m = parseInt(mStr, 10);
        const s = parseInt(sStr, 10);

        assert.ok(d >= 0 && d <= max, `Degrees out of range: ${d} in "${dms}"`);
        assert.ok(m >= 0 && m <= 59, `Minutes out of range: ${m} in "${dms}"`);
        assert.ok(s >= 0 && s <= 59, `Seconds out of range: ${s} in "${dms}"`);

        if (isLat) {
          assert.strictEqual(dir, deg >= 0 ? "N" : "S");
        } else {
          assert.strictEqual(dir, deg >= 0 ? "E" : "W");
        }
      }
    });
  });

  // =========================================================================
  // 2. fileToArrayBuffer Fallback and Native Execution Stress Testing
  // =========================================================================
  describe("fileToArrayBuffer Execution & Fallback Verification", () => {
    it("reads standard File with native .arrayBuffer() method", async () => {
      const testData = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      const file = new File([testData], "test.png", { type: "image/png" });

      const buffer = await fileToArrayBuffer(file);
      assert.ok(buffer instanceof ArrayBuffer);
      assert.strictEqual(buffer.byteLength, 8);
      assert.deepStrictEqual(new Uint8Array(buffer), testData);
    });

    it("handles 0-byte empty File with native .arrayBuffer()", async () => {
      const emptyFile = new File([], "empty.txt", { type: "text/plain" });
      const buffer = await fileToArrayBuffer(emptyFile);
      assert.strictEqual(buffer.byteLength, 0);
    });

    it("handles larger binary payloads without data corruption", async () => {
      const largeData = new Uint8Array(64 * 1024); // 64KB
      for (let i = 0; i < largeData.length; i++) {
        largeData[i] = i % 256;
      }
      const file = new File([largeData], "large.bin", { type: "application/octet-stream" });

      const buffer = await fileToArrayBuffer(file);
      assert.strictEqual(buffer.byteLength, 64 * 1024);
      assert.deepStrictEqual(new Uint8Array(buffer), largeData);
    });

    it("falls back to FileReader when file.arrayBuffer is not a function", async () => {
      const originalFileReader = (globalThis as any).FileReader;

      try {
        const expectedArray = new Uint8Array([1, 2, 3, 4, 5]);
        const mockArrayBuffer = expectedArray.buffer;

        let readAsArrayBufferCalled = false;

        // Custom mock FileReader
        (globalThis as any).FileReader = class CustomMockFileReader {
          result: any = null;
          onload: (() => void) | null = null;
          onerror: ((err: any) => void) | null = null;

          readAsArrayBuffer(blob: any) {
            readAsArrayBufferCalled = true;
            setTimeout(() => {
              this.result = mockArrayBuffer;
              if (this.onload) this.onload();
            }, 5);
          }
        };

        // File-like object without arrayBuffer method
        const legacyFile: any = {
          name: "legacy.dat",
          type: "application/octet-stream",
          size: 5,
        };

        const result = await fileToArrayBuffer(legacyFile);
        assert.strictEqual(readAsArrayBufferCalled, true);
        assert.strictEqual(result, mockArrayBuffer);
        assert.deepStrictEqual(new Uint8Array(result), expectedArray);
      } finally {
        (globalThis as any).FileReader = originalFileReader;
      }
    });

    it("propagates FileReader onerror event when file.arrayBuffer is absent", async () => {
      const originalFileReader = (globalThis as any).FileReader;

      try {
        (globalThis as any).FileReader = class ErrorMockFileReader {
          onload: (() => void) | null = null;
          onerror: ((err: any) => void) | null = null;

          readAsArrayBuffer() {
            setTimeout(() => {
              if (this.onerror) this.onerror(new Error("Simulated I/O disk failure"));
            }, 5);
          }
        };

        const legacyFile: any = { name: "error.dat" };

        await assert.rejects(
          async () => {
            await fileToArrayBuffer(legacyFile);
          },
          /Simulated I\/O disk failure/
        );
      } finally {
        (globalThis as any).FileReader = originalFileReader;
      }
    });

    it("rejects gracefully when both file.arrayBuffer and FileReader are undefined", async () => {
      const originalFileReader = (globalThis as any).FileReader;

      try {
        (globalThis as any).FileReader = undefined;

        const legacyFile: any = { name: "no-reader.dat" };

        await assert.rejects(
          async () => {
            await fileToArrayBuffer(legacyFile);
          },
          /FileReader not supported in this environment/
        );
      } finally {
        (globalThis as any).FileReader = originalFileReader;
      }
    });
  });
});
