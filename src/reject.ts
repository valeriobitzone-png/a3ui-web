// SPDX-License-Identifier: Apache-2.0
// Part of the A3 universe. See LICENSE.
/** SPEC_A3UI §2: omitted tuple fields MUST NOT become silent placeholders. */

export class SurfaceReject extends Error {
  readonly code: string;

  constructor(code: string, reason: string) {
    super(`${code}: ${reason}`);
    this.name = "SurfaceReject";
    this.code = code;
  }
}
