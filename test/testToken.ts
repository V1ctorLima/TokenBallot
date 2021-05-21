import { ethers } from "hardhat";
import { Contract, ContractFactory, Signer } from "ethers";
import { expect } from "chai";

const PROPOSALS = ["toddy", "nescau", "nesquik"];

describe("Ballot", function () {
  let accounts: Signer[];
  let contract: Contract;
  let ownerAddress: String;

  beforeEach(async function () {
    accounts = await ethers.getSigners();
    ownerAddress = await accounts[0].getAddress();
    const BallotContract: ContractFactory = await ethers.getContractFactory("Ballot");
    const ERC20ContractFactory = await ethers.getContractFactory("contracts/BallotTokenFactory.sol:BallotTokenFactory");
    const deployedFactory = await ERC20ContractFactory.deploy();
    let proposalsbytes32: any[] = []
    PROPOSALS.forEach(function(text) {
      proposalsbytes32.push(ethers.utils.formatBytes32String(text))});
    contract = await BallotContract.deploy(deployedFactory.address, proposalsbytes32);
    await contract.deployTokenBallot();
});

  it("Should deploy and set list of Proposals correctly", async function () {
    expect(ethers.utils.parseBytes32String((await contract.proposals(0)).name)).to.equal(PROPOSALS[0]);
  });

  it("Should create the chairperson as the contract owner", async function () {
    let message = "CHAIRPERSON_ROLE";
    let messageBytes = ethers.utils.toUtf8Bytes(message);
    expect(await contract.hasRole(ethers.utils.keccak256(messageBytes), ownerAddress)).to.be.equal(true);
  });

  it("Should fail when not chairman try to give right to vote", async function () {
    await expect(contract.connect(accounts[1]).giveRightToVote(accounts[2].getAddress())).to.be.revertedWith("AccessControl: account 0x70997970c51812dc3a010c7d01b50e0d17dc79c8 is missing role 0xd83c1a50dc0a09945cd355882e9b92d840723815900d90b54a78888e14a1acee");
  });

  it("Should fail if delegate your vote after you voted", async function () {
    await contract.giveRightToVote(accounts[1].getAddress());
    await contract.connect(accounts[1]).vote(0);
    await expect(contract.giveRightToVote(accounts[1].getAddress())).to.be.revertedWith("The voter already voted.");
  });

  it("Should not allow self-delegation", async function () {
    await contract.giveRightToVote(accounts[1].getAddress());
    await expect(contract.connect(accounts[1]).delegate(accounts[1].getAddress())).to.be.revertedWith("Self-delegation is disallowed.");
  });

  it("Should delegate the vote and the voted propose should have 2 votes", async function () {
//   console.log(await contract.balanceOfTokenBallot(accounts[0].getAddress()));
    await contract.giveRightToVote(accounts[1].getAddress());
    await contract.connect(accounts[0]).delegate(accounts[1].getAddress());
//    console.log(await contract.balanceOfTokenBallot(accounts[0].getAddress()));
    await contract.connect(accounts[1]).vote(2);
//    console.log(await contract.balanceOfTokenBallot(accounts[0].getAddress()));
//    expect(ethers.utils.parseBytes32String((await contract.winnerName()))).to.equal(PROPOSALS[2]);
  });

  it("Should not allow vote if someone don't have right to vote", async function () {
    await expect(contract.connect(accounts[1]).vote(0)).to.be.revertedWith("Has no right to vote");
  });

  it("Should not allow vote if the person already voted", async function () {
    await contract.giveRightToVote(accounts[1].getAddress());
    await contract.connect(accounts[1]).vote(0);
    await expect(contract.connect(accounts[1]).vote(0)).to.be.revertedWith("Already voted.");
  });

  it("Winning proposal should be the most voted", async function () {
    await contract.giveRightToVote(accounts[1].getAddress());
    await contract.connect(accounts[1]).vote(1);
    await contract.giveRightToVote(accounts[2].getAddress());
    await contract.connect(accounts[2]).vote(1);
    expect(ethers.utils.parseBytes32String((await contract.winnerName()))).to.equal(PROPOSALS[1]);
  });
});
