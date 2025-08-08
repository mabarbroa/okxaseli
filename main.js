require('dotenv').config();
const Web3 = require('web3');
const axios = require('axios');

// Setup Web3
const web3 = new Web3(new Web3.providers.HttpProvider(process.env.OPTIMISM_RPC_URL));

// Load Wallet (pastikan private key sudah ada di .env)
const account = web3.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY);
web3.eth.accounts.wallet.add(account);
web3.eth.defaultAccount = account.address;

// Alamat kontrak token yang ingin ditukar
const tokenAddress = process.env.TOKEN_ADDRESS;  // Isi dengan alamat kontrak token

// OKX DEX Router Contract Address dan ABI
const routerAddress = '0x5c69bEe701ef814a2B6a3EDD2B0751E1c9734A34'; // Contoh alamat router Uniswap
const routerABI = [
    // Hanya bagian ABI yang diperlukan
    {
        "constant": false,
        "inputs": [
            {
                "name": "amountOutMin",
                "type": "uint256"
            },
            {
                "name": "path",
                "type": "address[]"
            },
            {
                "name": "to",
                "type": "address"
            },
            {
                "name": "deadline",
                "type": "uint256"
            }
        ],
        "name": "swapExactTokensForETH",
        "outputs": [
            {
                "name": "",
                "type": "uint256[]"
            }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

// Token Contract untuk mendapatkan allowance
const tokenABI = [
    {
        "constant": true,
        "inputs": [
            {
                "name": "owner",
                "type": "address"
            },
            {
                "name": "spender",
                "type": "address"
            }
        ],
        "name": "allowance",
        "outputs": [
            {
                "name": "",
                "type": "uint256"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "spender",
                "type": "address"
            },
            {
                "name": "value",
                "type": "uint256"
            }
        ],
        "name": "approve",
        "outputs": [
            {
                "name": "",
                "type": "bool"
            }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

// Fungsi untuk approve token agar bisa dipakai oleh DEX Router
const approveToken = async (tokenAddress, amount) => {
    const token = new web3.eth.Contract(tokenABI, tokenAddress);
    const approve = await token.methods.approve(routerAddress, amount).send({ from: account.address });
    console.log('Token Approved:', approve);
};

// Fungsi untuk swap token ke ETH
const swapTokenForETH = async (amountIn, tokenAddress) => {
    const router = new web3.eth.Contract(routerABI, routerAddress);
    const path = [tokenAddress, '0x4200000000000000000000000000000000000006']; // Token -> WETH Address di Optimism
    const to = account.address;
    const deadline = Math.floor(Date.now() / 1000) + 600; // 10 menit dari sekarang

    // Estimate slippage (slippage toleransi 1% dalam contoh ini)
    const amountOutMin = 0;

    // Fungsi swapExactTokensForETH
    await router.methods.swapExactTokensForETH(amountIn, amountOutMin, path, to, deadline).send({ from: account.address, gas: 200000 });
    console.log(`Swap ${amountIn} tokens berhasil dilakukan`);
};

// Main fungsi untuk menjalankan swap
const main = async () => {
    const amountIn = web3.utils.toWei('0.1', 'ether'); // Ganti dengan jumlah yang ingin ditukar
    await approveToken(tokenAddress, amountIn);
    await swapTokenForETH(amountIn, tokenAddress);
};

main().catch(console.error);
