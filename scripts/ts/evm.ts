import { ethers, hexlify, ZeroHash } from "ethers";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import dotenv from "dotenv";

dotenv.config();

const APPROVE_EVM_ABI = [
    "function approve(address spender, uint256 amount) public returns (bool)",
];
const TOKEN_MESSENGER_V2_EVM_ABI = [
    "function depositForBurn(uint256 amount, uint32 destinationDomain, bytes32 mintRecipient, address burnToken, bytes32 destinationCaller, uint256 maxFee, uint32 minFinalityThreshold) public",
    "function depositForBurnWithHook(uint256 amount, uint32 destinationDomain, bytes32 mintRecipient, address burnToken, bytes32 destinationCaller, uint256 maxFee, uint32 minFinalityThreshold, bytes hookData) public",
];
const MESSAGE_TRANSMITTER_V2_EVM_ABI = [
    "function receiveMessage(bytes message, bytes attestation) public returns (bool)",
];
const getContracts = () => {
    const provider = new ethers.JsonRpcProvider(process.env.EVM_RPC_URL);
    const wallet = new ethers.Wallet(process.env.EVM_PRIVATE_KEY!, provider);
    const usdcApproveContract = new ethers.Contract(
        process.env.EVM_USDC_ADDRESS!,
        APPROVE_EVM_ABI,
        wallet
    );
    const tokenMessengerV2Contract = new ethers.Contract(
        process.env.EVM_TOKEN_MESSENGER_ADDRESS!,
        TOKEN_MESSENGER_V2_EVM_ABI,
        wallet
    );
    const messageTransmitterV2Contract = new ethers.Contract(
        process.env.EVM_MESSAGE_TRANSMITTER_ADDRESS!,
        MESSAGE_TRANSMITTER_V2_EVM_ABI,
        wallet
    );
    const cctpAdapterContract = new ethers.Contract(
        process.env.EVM_CCTP_ADAPTER_ADDRESS!,
        MESSAGE_TRANSMITTER_V2_EVM_ABI,
        wallet
    );
    return {
        usdcApproveContract,
        tokenMessengerV2Contract,
        messageTransmitterV2Contract,
        cctpAdapterContract,
    };
}

const approve = async (usdcApproveContract: ethers.Contract, amount: number) => {
    console.log("Approving USDC spend on EVM...");
    const approveTx = await usdcApproveContract.approve(
      process.env.EVM_TOKEN_MESSENGER_ADDRESS!,
      amount
    );
    const approveTxReceipt = await approveTx.wait();
    if (approveTxReceipt.status === 1) {
      console.log("USDC spend approved", approveTxReceipt.hash);
    } else {
      console.error("Failed to approve USDC spend", approveTxReceipt);
      throw new Error("Failed to approve USDC spend");
    }
  }

export const depositForBurnEvm = async (
    amount: number,
    maxFee: number,
    minFinalityThreshold: number,
) => {
    const { usdcApproveContract, tokenMessengerV2Contract } = getContracts();
    await approve(usdcApproveContract, amount);
    console.log("Depositing for burn on EVM...");

    const destinationCaller = process.env.EVM_DESTINATION_CALLER || ZeroHash;

    const depositForBurnTx = await tokenMessengerV2Contract.depositForBurn(
        amount,
        5, // Remote domain, 5 for SOLANA
        hexlify(bs58.decode(process.env.SOL_USER_TOKEN_ACCOUNT!)), // Solana token account
        process.env.EVM_USDC_ADDRESS!,
        destinationCaller,
        maxFee,
        minFinalityThreshold
      );
      const depositForBurnTxReceipt = await depositForBurnTx.wait();
      if (depositForBurnTxReceipt.status != 1) {
        console.error("Failed to deposit for burn", depositForBurnTxReceipt);
        throw new Error("Failed to deposit for burn");
      }
      return depositForBurnTxReceipt.hash;
}

export const depositForBurnEvmWithHook = async (
    amount: number,
    maxFee: number,
    minFinalityThreshold: number,
    hookData: string
  ) => {
    const { usdcApproveContract, tokenMessengerV2Contract } = getContracts();
  
    await approve(usdcApproveContract, amount);

    const destinationCaller = process.env.EVM_DESTINATION_CALLER ?? ZeroHash;
  
    console.log("Depositing for burn on EVM with hook...");
    const depositForBurnTx = await tokenMessengerV2Contract.depositForBurnWithHook(
      amount,
      5, // Remote domain
      hexlify(bs58.decode(process.env.SOL_USER_TOKEN_ACCOUNT!)), // Solana token account
      process.env.EVM_USDC_ADDRESS!,
      destinationCaller,
      maxFee,
      minFinalityThreshold,
      hookData
    );
    const depositForBurnTxReceipt = await depositForBurnTx.wait();
    if (depositForBurnTxReceipt.status != 1) {
      console.error("Failed to deposit for burn", depositForBurnTxReceipt);
      throw new Error("Failed to deposit for burn");
    }
    return depositForBurnTxReceipt.hash;
  };

  export const receiveMessageEvm = async (
    message: string,
    attestation: string
  ) => {
    console.log("Receiving message on EVM...");
    const { cctpAdapterContract } = getContracts();
    console.log("CCTPAdapter address:", await cctpAdapterContract.getAddress());
    const receiveMessageTx = await cctpAdapterContract.receiveMessage(
      message,
      attestation
    );
    const receiveMessageTxReceipt = await receiveMessageTx.wait();
    if (receiveMessageTxReceipt.status != 1) {
      console.error("Failed to receive message", receiveMessageTxReceipt);
      throw new Error("Failed to receive message");
    }
    return receiveMessageTxReceipt.hash;
  };