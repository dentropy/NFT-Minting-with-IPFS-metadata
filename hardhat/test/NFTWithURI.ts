import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
import fs from "fs";

describe("Deploy and Mint", async function () {
  console.log("Current directory:", process.cwd());
  describe("Deploy", function () {
    it("Should deploy the contract", async function () {
      const [owner, otherAccount] = await ethers.getSigners();

      const NFTWithURIFactory = await ethers.getContractFactory("NFTWithURI");
      const NFTWithURI = await NFTWithURIFactory.deploy(owner.address);
      // await NFTWithURI.waitForDeployment()

      let minting_data = JSON.parse( await fs.readFileSync("./test/NFTData/minting_data.json") )

      console.log("minting_data.CID")
      console.log(minting_data.CID)

      for(var i = 0; i < minting_data.count; i++){
        let first_token = await NFTWithURI.connect(owner).safeMint(
          owner.address,
          "ipfs://" + minting_data.CID['/'] + `/${i}`
        );
      }


      let get_first_token = await NFTWithURI.ownerOf(0)
      let get_first_token_URI = await NFTWithURI.tokenURI(0)

      console.log("get_first_token owner")
      console.log(get_first_token)
      console.log("get_first_token_URI")
      console.log(get_first_token_URI)
      
    });
  });

  // describe("Withdrawals", function () {
  //   describe("Validations", function () {
  //     it("Should revert with the right error if called too soon", async function () {
  //       const { lock } = await loadFixture(deployOneYearLockFixture);

  //       await expect(lock.withdraw()).to.be.revertedWith(
  //         "You can't withdraw yet"
  //       );
  //     });
  //   });
  // })




})