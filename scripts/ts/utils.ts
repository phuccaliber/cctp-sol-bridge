import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

export const hexToBytes = (hex: string): Buffer => Buffer.from(hex.replace("0x", ""), "hex");

export const decodeEventNonceFromMessageV2 = (messageHex: string): Buffer => {
    const nonceIndex = 12;
    const nonceBytesLength = 32;
    const message = hexToBytes(messageHex);
    const eventNonceBytes = message.subarray(
        nonceIndex,
        nonceIndex + nonceBytesLength
    );
    return eventNonceBytes;
};

export interface FindProgramAddressResponse {
    publicKey: anchor.web3.PublicKey;
    bump: number;
}

export const findProgramAddress = (
    label: string,
    programId: PublicKey,
    extraSeeds: (string | number[] | Buffer | PublicKey)[] | undefined = undefined
): FindProgramAddressResponse => {
    const seeds = [Buffer.from(anchor.utils.bytes.utf8.encode(label))];
    if (extraSeeds) {
        for (const extraSeed of extraSeeds) {
            if (typeof extraSeed === "string") {
                seeds.push(Buffer.from(anchor.utils.bytes.utf8.encode(extraSeed)));
            } else if (Array.isArray(extraSeed)) {
                seeds.push(Buffer.from(extraSeed as number[]));
            } else if (Buffer.isBuffer(extraSeed)) {
                seeds.push(extraSeed as any);
            } else if (extraSeed instanceof PublicKey) {
                seeds.push(extraSeed.toBuffer() as any);
            }
        }
    }
    const res = PublicKey.findProgramAddressSync(seeds, programId);
    return { publicKey: res[0], bump: res[1] };
};

