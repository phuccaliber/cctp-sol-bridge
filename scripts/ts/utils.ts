import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import MESSAGE_TRANSMITTER_IDL from "./artifacts/message_transmitter_031.json";
import TOKEN_MESSENGER_MINTER_IDL from "./artifacts/token_messenger_minter_031.json";
import { MessageTransmitter } from "./artifacts/message_transmitter_031";
import { TokenMessengerMinter } from "./artifacts/token_messenger_minter_031";
import MESSAGE_TRANSMITTER_V2_IDL from "./artifacts/message_transmitter_v2.json";
import { MessageTransmitterV2 } from "./artifacts/message_transmitter_v2";
import { TokenMessengerMinterV2 } from "./artifacts/token_messenger_minter_v2";
import TOKEN_MESSENGER_MINTER_V2_IDL from "./artifacts/token_messenger_minter_v2.json";

export const hexToBytes = (hex: string): Buffer => Buffer.from(hex.replace("0x", ""), "hex");
export const evmAddressToBytes32 = (address: string): string =>
    `0x000000000000000000000000${address.replace("0x", "")}`;


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
};// Must set ANCHOR_WALLET and ANCHOR_PROVIDER_URL in .env


export const getAnchorConnection = () => {
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);
    return provider;
};


export function getPrograms(provider: anchor.AnchorProvider) {
    // Initialize contracts
    const messageTransmitterProgram = new anchor.Program(
        MESSAGE_TRANSMITTER_IDL as MessageTransmitter,
        provider
    );
    const tokenMessengerMinterProgram = new anchor.Program(
        TOKEN_MESSENGER_MINTER_IDL as TokenMessengerMinter,
        provider
    );
    return { messageTransmitterProgram, tokenMessengerMinterProgram };
}

export const getProgramsV2 = (provider: anchor.AnchorProvider) => {
    const messageTransmitterProgram = new anchor.Program<MessageTransmitterV2>(
        MESSAGE_TRANSMITTER_V2_IDL as MessageTransmitterV2,
        provider
    );
    const tokenMessengerMinterProgram =
        new anchor.Program<TokenMessengerMinterV2>(
            TOKEN_MESSENGER_MINTER_V2_IDL as TokenMessengerMinterV2,
            provider
        );
    return { messageTransmitterProgram, tokenMessengerMinterProgram };
}