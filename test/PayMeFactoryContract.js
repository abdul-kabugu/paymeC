const { ethers } = require("hardhat");
const { expect } = require("chai");


before(async function ()  {
  const [signerOne, signerTwo] = await ethers.getSigners();
  let PayMeFactoryContract= await ethers.getContractFactory("PayMeFactoryContract")
  
  const factory = await PayMeFactoryContract.connect(signerOne).deploy()

  // const owner = await factory.owner()
  console.log("owner of factor contract 1:", await factory.owner())
  console.log("owner of factor contract 2:", signerOne.address)

  const WalletImp = await ethers.getContractFactory("WalletImplementation")
  const walletImp = await WalletImp.deploy()

  const USDT = await ethers.getContractFactory("Token")
  const uSDT = await USDT.deploy("USDT", "USDT")
  const USDC = await ethers.getContractFactory("Token")
  const uSDC = await USDC.connect(signerOne).deploy("USDC", "USDC")


  await factory.deployed()
  await walletImp.deployed()
  await uSDT.deployed()
  await uSDC.deployed()
  console.log("owner of token contract 1:", await uSDC.owner())
  console.log("owner of token contract 2:", signerOne.address)

  factory.initialize(walletImp.address, signerOne.address)
  console.log("owner of factor contract 3:", await factory.owner())
  console.log("owner of factor contract 4:", signerOne.address)

  this.walletImp = walletImp
  this.factory = factory

  this.uSDC = uSDC
  this.uSDT = uSDT

  this.uuid1 = "9d3a196048c211edb8780242ac120002"
  this.uuid2 = "9d3a1be048c211edb8780242ac120002"

  this.WalletImp = WalletImp
  this.signerOne = signerOne
  this.signerTwo = signerTwo

  this.WP = await ethers.getContractFactory("WalletImplementation")
  });


describe("PayMeFactoryContract", function () {
  
  it("should deploy new wallet for new user", async function () {
   const res =  await this.factory.newWallet(this.uuid1)

   this.customer1Address = await this.factory.wallets(this.uuid1)

    expect(res).to.emit(
      this.factory,
      "NewWallets"
    ).withArgs(this.uuid1, this.customer1Address);
  });

  it("should revert deploy new wallet for new user", async function () {
     expect(this.factory.newWallet("")).to.be.revertedWith("WI: Invalid ID")
   });

  it("should confirm uSDT and uSDC balance to be 100", async function () {
    const payment = ethers.utils.parseEther("100");

     await  this.uSDT.mint(this.customer1Address, payment)
     await  this.uSDC.mint(this.customer1Address, payment)

     const wp = this.WP.attach(this.customer1Address)

     const uSDTBal = await wp.getERC20TokenBalance(this.uSDT.address)
     const uSDCBal = await wp.getERC20TokenBalance(this.uSDC.address)

     expect(uSDTBal).to.eq(payment)
     expect(uSDCBal).to.eq(payment)
  });

  it("should hold native token", async function(){
    const payment = ethers.utils.parseEther("100");

    await this.signerOne.sendTransaction({
      to: this.customer1Address,
      value: payment
    })

    const balance = await ethers.provider.getBalance(this.customer1Address)

    expect(balance).to.eq(payment)
  })

  it("should be able to transfer out tokens", async function(){
    const payment = ethers.utils.parseEther("50");

    const wp = this.WP.attach(this.customer1Address)

    await wp.connect(this.signerOne).transferERC20Token(this.uSDT.address, this.signerOne.address, payment)
    await wp.connect(this.signerOne).transferNativeToken(this.signerOne.address, payment)

    const balance = await ethers.provider.getBalance(this.customer1Address)
    const usdtBal = await wp.getERC20TokenBalance(this.uSDT.address)

    expect(balance).to.eq(payment)
    expect(usdtBal).to.eq(payment)
});


});