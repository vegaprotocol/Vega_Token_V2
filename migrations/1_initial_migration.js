const Migrations = artifacts.require("Migrations");
const Vega_2 = artifacts.require("Vega_2");
const ERC20_Vesting = artifacts.require("ERC20_Vesting");
const Vega_1_TEST_STANDIN_DO_NOT_DEPLOY = artifacts.require("Vega_1_TEST_STANDIN_DO_NOT_DEPLOY");


//ganache-cli -m "cherry manage trip absorb logic half number test shed logic purpose rifle"


module.exports = async function (deployer) {
  //1709605351 == Tue Mar 05 2024 02:22:31 GMT+0000
  await deployer.deploy(Vega_1_TEST_STANDIN_DO_NOT_DEPLOY, "1000000000000000000000000", "99999999999999999", "VEGA_1", "VEGA1");
  await deployer.deploy(Vega_2, "64999723000000000000000000", "1709605351", "VEGA PROTOCOL - VEGA TOKEN V2", "VEGA");
  await deployer.deploy(ERC20_Vesting, Vega_1_TEST_STANDIN_DO_NOT_DEPLOY.address, Vega_2.address);
  let vega_2_instance = await Vega_2.deployed();
  await vega_2_instance.transfer(ERC20_Vesting.address,"64999723000000000000000000");
};
