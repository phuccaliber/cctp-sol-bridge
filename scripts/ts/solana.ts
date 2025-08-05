import * as anchor from "@coral-xyz/anchor";
import { PublicKey, SystemProgram} from "@solana/web3.js";
import MESSAGE_TRANSMITTER_V2_IDL from "./artifacts/message_transmitter_v2.json";
import { MessageTransmitterV2 } from "./artifacts/message_transmitter_v2";
import { TokenMessengerMinterV2 } from "./artifacts/token_messenger_minter_v2";
import TOKEN_MESSENGER_MINTER_V2_IDL from "./artifacts/token_messenger_minter_v2.json";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import * as spl from "@solana/spl-token";
import dotenv from "dotenv";
import { decodeEventNonceFromMessageV2, findProgramAddress, hexToBytes } from "./utils";
dotenv.config();


// Must set ANCHOR_WALLET and ANCHOR_PROVIDER_URL in .env
export const getAnchorConnection = () => {
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);
    return provider;
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

export const getReceiveMessagePdasV2 = async (
    {
        messageTransmitterProgram,
        tokenMessengerMinterProgram,
    }: ReturnType<typeof getProgramsV2>,
    solUsdcAddress: PublicKey,
    remoteUsdcAddressHex: string,
    remoteDomain: string,
    nonce: Buffer
) => {
    const tokenMessengerAccount = findProgramAddress(
        "token_messenger",
        tokenMessengerMinterProgram.programId,
    );
    const messageTransmitterAccount = findProgramAddress(
        "message_transmitter",
        messageTransmitterProgram.programId
    );
    const tokenMinterAccount = findProgramAddress(
        "token_minter",
        tokenMessengerMinterProgram.programId
    );
    const localToken = findProgramAddress(
        "local_token",
        tokenMessengerMinterProgram.programId,
        [solUsdcAddress]
    );
    const remoteTokenMessengerKey = findProgramAddress(
        "remote_token_messenger",
        tokenMessengerMinterProgram.programId,
        [remoteDomain]
    );
    const remoteTokenKey = new PublicKey(hexToBytes(remoteUsdcAddressHex));
    const tokenPair = findProgramAddress(
        "token_pair",
        tokenMessengerMinterProgram.programId,
        [remoteDomain, remoteTokenKey]
    );
    const custodyTokenAccount = findProgramAddress(
        "custody",
        tokenMessengerMinterProgram.programId,
        [solUsdcAddress]
    );
    const authorityPda = findProgramAddress(
        "message_transmitter_authority",
        messageTransmitterProgram.programId,
        [tokenMessengerMinterProgram.programId]
    ).publicKey;
    const tokenMessengerEventAuthority = findProgramAddress(
        "__event_authority",
        tokenMessengerMinterProgram.programId
    );
    const usedNonce = findProgramAddress(
        "used_nonce",
        messageTransmitterProgram.programId,
        [nonce]
    ).publicKey;

    const tokenMessengerAccounts =
        await tokenMessengerMinterProgram.account.tokenMessenger.fetch(
            tokenMessengerAccount.publicKey
        );
    const feeRecipientTokenAccount = await getAssociatedTokenAddress(
        solUsdcAddress,
        tokenMessengerAccounts.feeRecipient
    );

    return {
        messageTransmitterAccount,
        tokenMessengerAccount,
        tokenMinterAccount,
        localToken,
        remoteTokenMessengerKey,
        remoteTokenKey,
        tokenPair,
        custodyTokenAccount,
        authorityPda,
        tokenMessengerEventAuthority,
        usedNonce,
        feeRecipientTokenAccount,
    };
};


export const receiveMessageSol = async (
    message: string,
    attestation: string
  ) => {
    console.log("Receiving message on Solana...");
    const provider = getAnchorConnection();

    const { messageTransmitterProgram, tokenMessengerMinterProgram } =
      getProgramsV2(provider);

    // Init needed variables
    const usdcAddress = new PublicKey(process.env.SOL_USDC_ADDRESS!);
    const userTokenAccount = new PublicKey(process.env.SOL_USER_TOKEN_ACCOUNT!);
    const remoteTokenAddressHex = process.env.EVM_USDC_ADDRESS!;
    const remoteDomain = process.env.EVM_DOMAIN!;
    const messageHex = message;
    const attestationHex = attestation;
    const nonce = decodeEventNonceFromMessageV2(messageHex);

    // Get PDAs
    const pdas = await getReceiveMessagePdasV2(
      { messageTransmitterProgram, tokenMessengerMinterProgram },
      usdcAddress,
      remoteTokenAddressHex,
      remoteDomain,
      nonce
    );
  
    // accountMetas list to pass to remainingAccounts
    const accountMetas: any[] = [];
    accountMetas.push({
      isSigner: false,
      isWritable: false,
      pubkey: pdas.tokenMessengerAccount.publicKey,
    });
    accountMetas.push({
      isSigner: false,
      isWritable: false,
      pubkey: pdas.remoteTokenMessengerKey.publicKey,
    });
    accountMetas.push({
      isSigner: false,
      isWritable: true,
      pubkey: pdas.tokenMinterAccount.publicKey,
    });
    accountMetas.push({
      isSigner: false,
      isWritable: true,
      pubkey: pdas.localToken.publicKey,
    });
    accountMetas.push({
      isSigner: false,
      isWritable: false,
      pubkey: pdas.tokenPair.publicKey,
    });
    accountMetas.push({
      isSigner: false,
      isWritable: true,
      pubkey: pdas.feeRecipientTokenAccount,
    });
    accountMetas.push({
      isSigner: false,
      isWritable: true,
      pubkey: userTokenAccount,
    });
    accountMetas.push({
      isSigner: false,
      isWritable: true,
      pubkey: pdas.custodyTokenAccount.publicKey,
    });
    accountMetas.push({
      isSigner: false,
      isWritable: false,
      pubkey: spl.TOKEN_PROGRAM_ID,
    });
    accountMetas.push({
      isSigner: false,
      isWritable: false,
      pubkey: pdas.tokenMessengerEventAuthority.publicKey,
    });
    accountMetas.push({
      isSigner: false,
      isWritable: false,
      pubkey: tokenMessengerMinterProgram.programId,
    });
  
    return await messageTransmitterProgram.methods
      .receiveMessage({
        message: Buffer.from(messageHex.replace("0x", ""), "hex"),
        attestation: Buffer.from(attestationHex.replace("0x", ""), "hex"),
      })
      .accounts({
        payer: provider.wallet.publicKey,
        caller: provider.wallet.publicKey,
        messageTransmitter: pdas.messageTransmitterAccount.publicKey,
        usedNonce: pdas.usedNonce,
        receiver: tokenMessengerMinterProgram.programId,
        program: messageTransmitterProgram.programId,
      })
      .remainingAccounts(accountMetas)
      .rpc({ skipPreflight: true });
  };
