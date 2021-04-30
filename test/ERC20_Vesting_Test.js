const Vega_2 = artifacts.require("Vega_2");
const Vega_1_TEST_STANDIN_DO_NOT_DEPLOY = artifacts.require("Vega_1_TEST_STANDIN_DO_NOT_DEPLOY");
const ERC20_Vesting = artifacts.require("ERC20_Vesting");


var abi = require('ethereumjs-abi');
var crypto = require("crypto");
var ethUtil = require('ethereumjs-util');

//TODO: ganache-cli -m "cherry manage trip absorb logic half number test shed logic purpose rifle"
let private_keys =
    {
        "0xb89a165ea8b619c14312db316baaa80d2a98b493":Buffer.from("adef89153e4bd6b43876045efdd6818cec359340683edaec5e8588e635e8428b",'hex'),
        "0x4ac2efe06b867213698ab317e9569872f8a5e85a":Buffer.from("cb5a94687bda25561b2574ce062f0b055f9525c930b3fc9183c019c562b9c404",'hex'),
        "0xbeec72c697e54598271ac242bf82cde87d5632e0":Buffer.from("c6a7cd6aa1eafe65c0703162b9128331558fa2f34bcee3a4276953a1acc6ae4e",'hex'),
        "0x4a03ccfbd091354723b9d46043f7cb194d94331b":Buffer.from("708392fa9b47f476ab7a03a76139ff472eb1b4acafafcbe8eb17c15933df8a71",'hex'),
        "0x56a16eb54698324304e29a23d65d2ff7f0b7170b":Buffer.from("9c23f288f45587c615bbecc0924e5708c7b27ce36f9dc9d242d8f3fd7aab389e",'hex'),
        "0x97166b688c609495c203df28cd2e6d5281f9f71f":Buffer.from("de935dc05c5b7cce5e1c27aa4d945b9d820536ee334d4a1c89debd333ae8d866",'hex'),
        "0x9c0b2939538b45b72adb3ec7c52e271f2560c27f":Buffer.from("2773543f4def90c5cef0d48d80465e40c8fc22675c7353d114e47fe0847e7683",'hex'),
        "0x13d6d873b31de82ae6724d3e5894b2b40fb968b2":Buffer.from("14e47f717c9005c60aa41f1a09b2b6bf8af3870f24de107692ac3aaa87686690",'hex'),
        "0x8447913d48723cbabdcead3377f49e82a3d494a3":Buffer.from("5d2b4629b4b06c8d6991d419126270741425c7a784c61179597098521f91afc5",'hex'),
        "0x32321e10a8a0e95f261591520c134d4a6d1743c1":Buffer.from("0ff107281c32f8940cb2a0c85bd0627bc427331ad2c9dd2811f1f01d1edb124a",'hex')
    };
let wallets = [
  "0xb89a165ea8b619c14312db316baaa80d2a98b493",
  "0x4ac2efe06b867213698ab317e9569872f8a5e85a",
  "0xbeec72c697e54598271ac242bf82cde87d5632e0",
  "0x4a03ccfbd091354723b9d46043f7cb194d94331b",
  "0x56a16eb54698324304e29a23d65d2ff7f0b7170b",
  "0x97166b688c609495c203df28cd2e6d5281f9f71f",
  "0x9c0b2939538b45b72adb3ec7c52e271f2560c27f",
  "0x13d6d873b31de82ae6724d3e5894b2b40fb968b2",
  "0x8447913d48723cbabdcead3377f49e82a3d494a3",
  "0x32321e10a8a0e95f261591520c134d4a6d1743c1"]
let new_asset_id = crypto.randomBytes(32);


///UTILITIES//////
let create_tranche = async (cliff_start, duration) =>{
  //create_tranche(uint256 cliff_start, uint256 duration) public only_controller
  let erc20_vesting_instance = await ERC20_Vesting.deployed();
  let receipt = await erc20_vesting_instance.create_tranche(cliff_start, duration);

  let result = receipt.logs.find(l => l.event === "Tranche_Created");
  if(result === undefined){
    throw "Tranche_Created event was not emitted";
  }
  return result;
}

let issue_into_tranche = async (user, tranche_id, amount, from) =>{
  if(from === undefined){
    from = wallets[0];
  }
  //issue_into_tranche(address user, uint8 tranche_id, uint256 amount) public controller_or_issuer {
  let erc20_vesting_instance = await ERC20_Vesting.deployed();
  let receipt = await erc20_vesting_instance.issue_into_tranche(user, tranche_id, amount, {from:from});
  let result = receipt.logs.find(l => l.event === "Tranche_Balance_Added");
  if(result === undefined){
    throw "Tranche_Balance_Added event was not emitted";
  }
  return result;
}
let move_into_tranche = async (user, tranche_id, amount) =>{
  //move_into_tranche(address user, uint8 tranche_id, uint256 amount) public only_controller {
  let erc20_vesting_instance = await ERC20_Vesting.deployed();
  let receipt = await erc20_vesting_instance.move_into_tranche(user, tranche_id, amount);
  let result = receipt.logs.find(l => l.event === "Tranche_Balance_Added");
  if(result === undefined){
    throw "Tranche_Balance_Added event was not emitted";
  }
  return result;
}
let get_tranche_balance = async (user, tranche_id) =>{
  //get_tranche_balance(address user, uint8 tranche_id) public view returns(uint256)
  let erc20_vesting_instance = await ERC20_Vesting.deployed();
  return await erc20_vesting_instance.get_tranche_balance(user, tranche_id);
}
let get_vested_for_tranche = async (user, tranche_id) =>{
  //get_vested_for_tranche(address user, uint8 tranche_id) public view returns(uint256)
  let erc20_vesting_instance = await ERC20_Vesting.deployed();
  return await erc20_vesting_instance.get_vested_for_tranche(user, tranche_id);
}
let v1_bal = async (user) =>{
  //v1_bal(address user) internal view returns(uint256)
  let erc20_vesting_instance = await ERC20_Vesting.deployed();
  let receipt = await erc20_vesting_instance.v1_bal(user);
}
let user_total_all_tranches = async (user) =>{
  //user_total_all_tranches(address user) public view returns(uint256)
  let erc20_vesting_instance = await ERC20_Vesting.deployed();
  return await erc20_vesting_instance.user_total_all_tranches(user);
}
let withdraw_from_tranche = async (tranche_id) =>{
  //withdraw_from_tranche(uint8 tranche_id) public
  let erc20_vesting_instance = await ERC20_Vesting.deployed();
  let receipt = await erc20_vesting_instance.withdraw_from_tranche(tranche_id);
  let result = receipt.logs.find(l => l.event === "Tranche_Balance_Removed");
  if(result === undefined){
    throw "Tranche_Balance_Removed event was not emitted";
  }
  return result;
}
let stake_tokens = async (amount, vega_public_key) =>{
  //stake_tokens(uint256 amount, bytes32 vega_public_key) public
  let erc20_vesting_instance = await ERC20_Vesting.deployed();
  let receipt = await erc20_vesting_instance.stake_tokens(amount, vega_public_key);
}
let remove_stake = async (amount) =>{
  // remove_stake(uint256 amount) public {
  let erc20_vesting_instance = await ERC20_Vesting.deployed();
  let receipt = await erc20_vesting_instance.remove_stake(amount);
}
let permit_issuer = async (issuer, amount) =>{
  // permit_issuer(address issuer, uint256 amount) public only_controller
  let erc20_vesting_instance = await ERC20_Vesting.deployed();
  let receipt = await erc20_vesting_instance.permit_issuer(issuer, amount);
  let result = receipt.logs.find(l => l.event === "Issuer_Permitted");
  if(result === undefined){
    throw "Issuer_Permitted event was not emitted";
  }
  return result;
}
let revoke_issuer = async (issuer) =>{
  // revoke_issuer(address issuer) public only_controller
  let erc20_vesting_instance = await ERC20_Vesting.deployed();
  let receipt = await erc20_vesting_instance.revoke_issuer(issuer);
  let result = receipt.logs.find(l => l.event === "Issuer_Revoked");
  if(result === undefined){
    throw "Issuer_Revoked event was not emitted";
  }
  return result;
}
let set_controller = async (new_controller) =>{
  // set_controller(address new_controller) public only_controller
  let erc20_vesting_instance = await ERC20_Vesting.deployed();
  let receipt = await erc20_vesting_instance.set_controller(new_controller);
}
let get_tranche = async (tranche_id) =>{
  // mapping(uint8 => tranche) public tranches;
  let erc20_vesting_instance = await ERC20_Vesting.deployed();
  return await erc20_vesting_instance.tranches(tranche_id);
}
let get_v2_address = async (tranche_id) =>{
  // mapping(uint8 => tranche) public tranches;
  let erc20_vesting_instance = await ERC20_Vesting.deployed();
  return await erc20_vesting_instance.v2_address();
}
let get_vega_balance = async (user) => {
  let vega_2_instance = await Vega_2.deployed();
  return await vega_2_instance.balanceOf(user);
}


function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}



contract("ERC20_Vesting",  (accounts) => {

      it("create_tranche", async () => {
        let cliff_start = "999999999999999999";
        let duration = "300";//5 min
        let tranche_created_event = await create_tranche(cliff_start, duration);
        let tranche = await get_tranche(tranche_created_event.args.tranche_id);
        /*
        console.log("tranche_id: " + tranche_created_event.args.tranche_id);
        console.log("cliff start: " + tranche.cliff_start.toString());
        console.log("duration: " + tranche.duration.toString());*/

        assert.equal(tranche.cliff_start.toString(), cliff_start, "cliff_start wrong");
        assert.equal(tranche.duration.toString(), duration, "duration wrong");
      });

      it("create auto-open tranche", async () => {
        let cliff_start = "0";
        let duration = "0";//5 min
        let tranche_created_event = await create_tranche(cliff_start, duration);
        let tranche = await get_tranche(tranche_created_event.args.tranche_id);
        /*
        console.log("tranche_id: " + tranche_created_event.args.tranche_id);
        console.log("cliff start: " + tranche.cliff_start.toString());
        console.log("duration: " + tranche.duration.toString());*/

        assert.equal(tranche.cliff_start.toString(), cliff_start, "cliff_start wrong");
        assert.equal(tranche.duration.toString(), duration, "duration wrong");
      });

    it("issue_into_tranche", async () => {

      let vesting_contract_balance = await get_vega_balance(ERC20_Vesting.address);
      //console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!")
      //console.log(vesting_contract_balance.toString())
      //console.log(await get_v2_address());
      //console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!")

      let tranche_id = (await create_tranche("999999999999999999", "300")).args.tranche_id;
      let amt_to_issue = "42";

      //console.log("tranche_id: " + tranche_id);
      //get wallets[1] balance before
      let bal_before = await get_tranche_balance(wallets[1], tranche_id);
      //console.log("before: " + bal_before);
      let total_before = await user_total_all_tranches(wallets[1]);
      //console.log("before: " + total_before);
      await issue_into_tranche(wallets[1], tranche_id.toString(), amt_to_issue);
      //console.log('issued');

      //get wallets[1] balance after
      let bal_after = await get_tranche_balance(wallets[1], tranche_id);
      //console.log("after: " + bal_after);
      let total_after = await user_total_all_tranches(wallets[1]);
      //console.log("after: " + total_after);

    });

    it("withdraw_from_tranche", async () => {
      //create_tranche
      let cliff_start = Math.floor(Date.now()/1000);

      //console.log(cliff_start)
      let duration = "10";
      let tranche_created_event = await create_tranche(cliff_start, duration);
      let tranche = await get_tranche(tranche_created_event.args.tranche_id);

      let initial_balance = await get_vega_balance(wallets[0]);
      //console.log("initial_balance: " + initial_balance);

      let to_issue = "100000000000000000000000";
      let midway_issue = "100000000000000000000000";
      let total_issue = "200000000000000000000000";
      //issue_into_tranche
      await issue_into_tranche(wallets[0], tranche_created_event.args.tranche_id.toString(), to_issue);
      //console.log("issued");
      let initial_vested = await get_vested_for_tranche(wallets[0], tranche_created_event.args.tranche_id.toString());
      //console.log("vested: " + web3.utils.fromWei(initial_vested) );
      //console.log("tranche_id: " + tranche_created_event.args.tranche_id.toString())


      for(let cycle = 0; cycle < 12; cycle++){
        await timeout(1000);

        //this triggers a block to be mined
        await issue_into_tranche(wallets[3], tranche_created_event.args.tranche_id.toString(), "1");
        //should be done
        vested = await get_vested_for_tranche(wallets[0], tranche_created_event.args.tranche_id.toString());
        //console.log("vested: " + web3.utils.fromWei(vested))

        if(cycle % 2 === 0){
          let withdraw_result = await withdraw_from_tranche(tranche_created_event.args.tranche_id);
          //console.log("withdrawn: " + web3.utils.fromWei(withdraw_result.args.amount));
          //console.log("total remaining: " + web3.utils.fromWei(await user_total_all_tranches(wallets[0])))
        }

        if(cycle === 3){
          //console.log("issuing midway...")
          await issue_into_tranche(wallets[0], tranche_created_event.args.tranche_id.toString(), midway_issue);
        }
      }
      await timeout(5000);
      //this triggers a block to be mined
      await issue_into_tranche(wallets[3], tranche_created_event.args.tranche_id.toString(), "1");
      //should be done
      vested = await get_vested_for_tranche(wallets[0], tranche_created_event.args.tranche_id.toString());
      //console.log("vested: " + vested)
      let withdraw_result = await withdraw_from_tranche(tranche_created_event.args.tranche_id);
      //console.log("withdrawn: " + withdraw_result.args.amount.toString());

      //todo assert balances
      let final_balance = await get_vega_balance(wallets[0]);
      //console.log("final_balance: " + final_balance);
      assert.equal(final_balance.toString(),total_issue, "wrong end balance" )
    });

    it("Stake tokens, fail to withdraw, remove stake", async() => {
        let to_issue = "100000";
        //create 2 tranches that vest immediatly
        let cliff_start = "0";
        let duration = "0";//5 min
        let tranche_created_event = await create_tranche(cliff_start, duration);
        let tranche_1_id = tranche_created_event.args.tranche_id;
        let tranche_1 = await get_tranche(tranche_1_id);

        cliff_start = "0";
        duration = "0";
        let tranche_2_created_event = await create_tranche(cliff_start, duration);
        let tranche_2_id = tranche_2_created_event.args.tranche_id;
        let tranche_2 = await get_tranche(tranche_2_id);

        let initial_balance = await get_vega_balance(wallets[0]);

        //issue same amt into the 2 tranches
        await issue_into_tranche(wallets[0], tranche_1_id, to_issue);
        await issue_into_tranche(wallets[0], tranche_2_id, to_issue);

        //stake that amt
        await stake_tokens(to_issue, "0x8ee95176cd9486ad9e5a4a3cd5c5ddc243cb6b5a54d3da26277d1905cfc4a178");

        //try to withdraw from one, should work
        let withdraw_result_1 = await withdraw_from_tranche(tranche_1_id);

        //try to withdraw from other, should fail
        try {
          await withdraw_from_tranche(tranche_2_id);
          assert.equal(true, false, "withdrawal worked, shouldn't have");
        } catch(e) {}


        //remove stake
        await remove_stake(to_issue);

        //try to withdraw from other, should work
        let withdraw_result_2 = await withdraw_from_tranche(tranche_2_id);

        let balance = await get_vega_balance(wallets[0]);

        assert.equal(balance.sub(initial_balance).toString(), "200000", "staking failed");

    });

    it("move v1 from tranche zero into new tranche, then withdraw", async() => {
        // this is in migrations
        let v1_expected_balance = "1000000000000000000000000";
        //get balance of tranche zero should be v1_expected_balance
        let tranche_0_initial_balance = await get_tranche_balance(wallets[0], 0);
        assert.equal(tranche_0_initial_balance.toString(),v1_expected_balance, "tranche 0 initial balance wrong");

        let wallet_0_initial_balance = await get_vega_balance(wallets[0]);


        //create new zero-time tranche
        let tranche_created_event = await create_tranche("0", "0");
        let tranche_id = tranche_created_event.args.tranche_id;
        let tranche = await get_tranche(tranche_id);

        //move_to
        await move_into_tranche(wallets[0], tranche_id, v1_expected_balance);

        //tranche 0 bal should be zero
        let tranche_0_final_balance = await get_tranche_balance(wallets[0], 0);
        assert.equal(tranche_0_final_balance.toString(),"0", "tranche 0 should now be empty");

        //new tranche balance should be v1_expected_balance
        let new_tranche_balance = await get_tranche_balance(wallets[0], tranche_id);
        assert.equal(new_tranche_balance.toString(),v1_expected_balance, "new tranche balance incorrect")

        //withdraw, this is covered in the withdrawal test
        await withdraw_from_tranche(tranche_id);

        //user's v2 balance should now be v1_expected_balance
        let wallet_0_final_balance = await get_vega_balance(wallets[0]);
        assert.equal(wallet_0_final_balance.sub(wallet_0_initial_balance).toString(), v1_expected_balance, "final balance is incorrect")

    });

    it("permitted issuer", async() => {
      let to_issue = "1000000000000000000000000";

      let tranche_created_event = await create_tranche("0", "0");
      let tranche_id = tranche_created_event.args.tranche_id;

      //fail to issue
      try {
        await issue_into_tranche(wallets[3], tranche_id, to_issue, wallets[1]);
        assert.equal(true, false, "allowed issue, shouldn't have");
      } catch(ex){}

      //permit
      await permit_issuer(wallets[1], to_issue);

      //issue entire permission
      await issue_into_tranche(wallets[3], tranche_id, to_issue, wallets[1]);

      // fail to issue
      try {
        await issue_into_tranche(wallets[3], tranche_id, to_issue, wallets[1]);
        assert.equal(true, false, "allowed issue, shouldn't have");
      } catch(ex){}


      //permit
      await permit_issuer(wallets[1], to_issue);

      //revoke
      await revoke_issuer(wallets[1]);

      //fail to issue
      try {
        await issue_into_tranche(wallets[3], tranche_id, to_issue, wallets[1]);
        assert.equal(true, false, "allowed issue, shouldn't have");
      } catch(ex){}
    });

    it("v1->v2 update mapping", async () => {
      /////////////
      //issue to 0xe9abed28fd7a0cab7031a4eefe8d8cc42f2bf837
      //mapped to 0x32321e10a8a0e95f261591520c134d4a6d1743c1 (addresses[9]);
      //TODO test mapping
      let erc20_vesting_instance = await ERC20_Vesting.deployed();
      let test_token_instance = await Vega_1_TEST_STANDIN_DO_NOT_DEPLOY.deployed();

      let tranche_zero_address9_before = await erc20_vesting_instance.get_tranche_balance(accounts[9], 0);
      let tranche_zero_mapped_before = await erc20_vesting_instance.get_tranche_balance("0xe9abed28fd7a0cab7031a4eefe8d8cc42f2bf837", 0);
      assert.equal(tranche_zero_address9_before.toString(), "0", "tranche_zero_address9_before bad");
      assert.equal(tranche_zero_mapped_before.toString(), "0", "tranche_zero_mapped_before bad");

      //issue test token to 0xe9abed28fd7a0cab7031a4eefe8d8cc42f2bf837
      // 1000
      await test_token_instance.transfer("0xe9abed28fd7a0cab7031a4eefe8d8cc42f2bf837", "1000000000000000000000");

      let tranche_zero_address9_after = await erc20_vesting_instance.get_tranche_balance(accounts[9], 0);
      let tranche_zero_mapped_after = await erc20_vesting_instance.get_tranche_balance("0xe9abed28fd7a0cab7031a4eefe8d8cc42f2bf837", 0);

      assert.equal(tranche_zero_address9_after.toString(), "1000000000000000000000", "tranche_zero_address9_after bad");
      assert.equal(tranche_zero_mapped_after.toString(), "0", "tranche_zero_mapped_after bad");

      //make new open tranche
      let tranche_created_event = await create_tranche("0", "0");
      let tranche_id = tranche_created_event.args.tranche_id;

      //issue into tranche for addresses[9]
      await issue_into_tranche(wallets[9], tranche_id, "1000000000000000000000", accounts[0]);

    });
});
