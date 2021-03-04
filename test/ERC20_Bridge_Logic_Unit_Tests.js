const ERC20_Asset_Pool = artifacts.require("ERC20_Asset_Pool");
const ERC20_Bridge_Logic = artifacts.require("ERC20_Bridge_Logic");
const Base_Faucet_Token = artifacts.require("Base_Faucet_Token");
const MultisigControl = artifacts.require("MultisigControl");


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

let new_asset_id = crypto.randomBytes(32);

let bridge_addresses = require(root_path + "bridge_addresses.json");

async function deposit_asset(bridge_logic_instance, test_token_instance, account, token_balance){
  let wallet_pubkey = crypto.randomBytes(32);
  await test_token_instance.faucet();
  if(token_balance === undefined || token_balance === null){
    token_balance = await test_token_instance.balanceOf(account);
  }
  await test_token_instance.approve(ERC20_Bridge_Logic.address, token_balance);
  await bridge_logic_instance.deposit_asset(bridge_addresses.test_token_address, token_balance, wallet_pubkey);
  return token_balance;
}

async function withdraw_asset(bridge_logic_instance, test_token_instance, account, expire, bad_params, bad_user){
  let nonce = new ethUtil.BN(crypto.randomBytes(32));
  let expiry = Math.floor(Date.now()/1000) + 2; // 2 seconds
  let to_withdraw = (await test_token_instance.balanceOf(ERC20_Asset_Pool.address)).toString();

  let target = account;

  //create signature
  let encoded_message = get_message_to_sign(
      ["address", "uint256", "uint256", "address"],
      [test_token_instance.address, to_withdraw, expiry, target],
      nonce,
      "withdraw_asset",
      ERC20_Bridge_Logic.address);
  let encoded_hash = ethUtil.keccak256(encoded_message);
  let signature = ethUtil.ecsign(encoded_hash, private_keys[account.toLowerCase()]);

  let sig_string = to_signature_string(signature);
  if(expire){
    //wait 3 seconds
    await timeout(3000);
  }
  //NOTE Sig tests are in MultisigControl
  if(bad_params){
    to_withdraw = "1"
  }
  await bridge_logic_instance.withdraw_asset(test_token_instance.address, to_withdraw, expiry, target, nonce, sig_string);
}


async function set_bridge_address(bridge_logic_instance, asset_pool_instance, account){
  let nonce = new ethUtil.BN(crypto.randomBytes(32));
  //create signature
  let encoded_message = get_message_to_sign(
      ["address"],
      [bridge_logic_instance.address],
      nonce,
      "set_bridge_address",
      asset_pool_instance.address);
  let encoded_hash = ethUtil.keccak256(encoded_message);

  let signature = ethUtil.ecsign(encoded_hash, private_keys[account.toLowerCase()]);
  let sig_string = to_signature_string(signature);

  //NOTE Sig tests are in MultisigControl
  await asset_pool_instance.set_bridge_address(bridge_logic_instance.address, nonce, sig_string);
}



async function list_asset(bridge_logic_instance, from_address){
  let nonce = new ethUtil.BN(crypto.randomBytes(32));
  //create signature
  let encoded_message = get_message_to_sign(
      ["address", "bytes32"],
      [bridge_addresses.test_token_address, new_asset_id],
      nonce,
      "list_asset",
      ERC20_Bridge_Logic.address);
  let encoded_hash = ethUtil.keccak256(encoded_message);

  let signature = ethUtil.ecsign(encoded_hash, private_keys[from_address.toLowerCase()]);
  let sig_string = to_signature_string(signature);

  //NOTE Sig tests are in MultisigControl
  await bridge_logic_instance.list_asset(bridge_addresses.test_token_address, new_asset_id, nonce, sig_string);
}


async function remove_asset(bridge_logic_instance, from_address){
  //bridge_addresses.test_token_address

  let nonce = new ethUtil.BN(crypto.randomBytes(32));


  //create signature
  let encoded_message = get_message_to_sign(
      ["address"],
      [bridge_addresses.test_token_address],
      nonce,
      "remove_asset",
      ERC20_Bridge_Logic.address);
  let encoded_hash = ethUtil.keccak256(encoded_message);

  let signature = ethUtil.ecsign(encoded_hash, private_keys[from_address.toLowerCase()]);
  let sig_string = to_signature_string(signature);

  //NOTE Sig tests are in MultisigControl
  await bridge_logic_instance.remove_asset(bridge_addresses.test_token_address, nonce, sig_string);
}



////FUNCTIONS
contract("ERC20_Bridge_Logic Function: list_asset",  (accounts) => {
  //function list_asset(address asset_source, uint256 asset_id, bytes32 vega_id, uint256 nonce, bytes memory signatures) public;


    it("asset that was not listed is listed after running list_asset", async () => {

      let bridge_logic_instance = await ERC20_Bridge_Logic.deployed();
      let test_token_instance = await Base_Faucet_Token.deployed();

      //new asset ID is not listed
      assert.equal(
          await bridge_logic_instance.is_asset_listed(bridge_addresses.test_token_address),
          false,
          "token is listed, shouldn't be"
      );
      //unlisted asset cannot be deposited
      try{
        await deposit_asset(bridge_logic_instance, test_token_instance, account[0]);
        assert.equal(
            true,
            false,
            "token deposit worked, shouldn't have"
        );
      } catch(e){}

      //list new asset
      list_asset(bridge_logic_instance, accounts[0]);

      //new asset ID is listed
      assert.equal(
          await bridge_logic_instance.is_asset_listed(bridge_addresses.test_token_address),
          true,
          "token isn't listed, should be"
      );
      //deposit new asset
      let amount_deposited = await deposit_asset(bridge_logic_instance, test_token_instance, accounts[0]);

      //user balance deducted
      assert.equal(
          await test_token_instance.balanceOf(accounts[0]),
          0,
          "token balance was not deposited, balance should be zero"
      );


    });

    it("list_asset fails to list an already listed asset", async () => {
      let bridge_logic_instance = await ERC20_Bridge_Logic.deployed();
      //new asset ID is listed
      assert.equal(
          await bridge_logic_instance.is_asset_listed(bridge_addresses.test_token_address),
          true,
          "token isn't listed, should be"
      );
      //list new asset fails
      try {
        await list_asset(bridge_logic_instance, accounts[0]);
        assert.equal(
          false,
            true,
            "attempting to relist token succeded, shouldn't have"
        );
      }catch(e){}

    });

    //NOTE signature tests are covered in MultisigControl
});
contract("ERC20_Bridge_Logic Function: remove_asset",   (accounts) => {
    //function remove_asset(address asset_source, uint256 asset_id, uint256 nonce, bytes memory signatures) public;
    it("listed asset is not listed after running remove_asset and no longer able to deposited", async () => {
      let bridge_logic_instance = await ERC20_Bridge_Logic.deployed();
      let test_token_instance = await Base_Faucet_Token.deployed();

      try {
        await list_asset(bridge_logic_instance, accounts[0]);
      } catch(e){/*ignore if already listed*/}

      //new asset ID is listed
      assert.equal(
          await bridge_logic_instance.is_asset_listed(bridge_addresses.test_token_address),
          true,
          "token isn't listed, should be"
      );
      //deposit new asset, should work
      let amount_deposited = await deposit_asset(bridge_logic_instance, test_token_instance, accounts[0]);

      //remove new asset
      await remove_asset(bridge_logic_instance, accounts[0]);

      //deposit fails
      try {
        await deposit_asset(bridge_logic_instance, test_token_instance, accounts[0]);
        assert.equal(true, false, "deposit of removed asset succedded, shouldn't have")
      }catch(e){}

    });

});
contract("ERC20_Bridge_Logic Function: set_deposit_minimum",   (accounts) => {
    //function set_deposit_minimum(address asset_source, uint256 asset_id, uint256 nonce, uint256 minimum_amount, bytes memory signatures) public;

    it("deposit minimum changes and is enforced by running set_deposit_minimum", async () => {
      let bridge_logic_instance = await ERC20_Bridge_Logic.deployed();
      let test_token_instance = await Base_Faucet_Token.deployed();

      //Get minimum deposit
      let deposit_minimum = (await bridge_logic_instance.get_deposit_minimum(test_token_instance.address)).toString();
      assert.equal(deposit_minimum,"0", "deposit min should be zero, isn't");

      try {
        await list_asset(bridge_logic_instance, accounts[0]);
      } catch(e){/*ignore if already listed*/}

      //new asset ID is listed
      assert.equal(
          await bridge_logic_instance.is_asset_listed(test_token_instance.address),
          true,
          "token isn't listed, should be"
      );

      //Set minimum deposit
      //NOTE signature tests are in MultisigControl
      let nonce = new ethUtil.BN(crypto.randomBytes(32));
      let encoded_message = get_message_to_sign(
          ["address", "uint256"],
          [test_token_instance.address, "500"],
          nonce,
          "set_deposit_minimum",
          ERC20_Bridge_Logic.address);
      let encoded_hash = ethUtil.keccak256(encoded_message);

      let signature = ethUtil.ecsign(encoded_hash, private_keys[accounts[0].toLowerCase()]);
      let sig_string = to_signature_string(signature);

      await bridge_logic_instance.set_deposit_minimum(test_token_instance.address, "500", nonce, sig_string);

      //Get minimum deposit, should be updated
      deposit_minimum = (await bridge_logic_instance.get_deposit_minimum(test_token_instance.address)).toString();
      assert.equal(deposit_minimum, "500", "deposit min should be 500, isn't");

      //deposit less that min should fail
      try{
        await deposit_asset(bridge_logic_instance, test_token_instance, "499");
        assert.equal(
            true,
            false,
            "token deposit worked, shouldn't have"
        );
      } catch(e){}

      //deposit more that min should work
      await deposit_asset(bridge_logic_instance, test_token_instance, accounts[0], "501");
    });
});

contract("ERC20_Bridge_Logic Function: set_deposit_maximum",   (accounts) => {
    //function set_deposit_maximum(address asset_source, uint256 asset_id, uint256 nonce, uint256 maximum_amount, bytes memory signatures) public;

    it("deposit maximum changes and is enforced by running set_deposit_maximum", async () => {
      let bridge_logic_instance = await ERC20_Bridge_Logic.deployed();
      let test_token_instance = await Base_Faucet_Token.deployed();

      //Get maximum deposit
      let deposit_maximum = (await bridge_logic_instance.get_deposit_maximum(test_token_instance.address)).toString();
      assert.equal(deposit_maximum,"0", "deposit max should be zero, isn't");

      try {
        await list_asset(bridge_logic_instance, accounts[0]);
      } catch(e){/*ignore if already listed*/}

      //new asset ID is listed
      assert.equal(
          await bridge_logic_instance.is_asset_listed(test_token_instance.address),
          true,
          "token isn't listed, should be"
      );

      //Set maximum deposit
      //NOTE signature tests are in MultisigControl
      let nonce = new ethUtil.BN(crypto.randomBytes(32));
      let encoded_message = get_message_to_sign(
          ["address", "uint256"],
          [test_token_instance.address, "500"],
          nonce,
          "set_deposit_maximum",
          ERC20_Bridge_Logic.address);
      let encoded_hash = ethUtil.keccak256(encoded_message);

      let signature = ethUtil.ecsign(encoded_hash, private_keys[accounts[0].toLowerCase()]);
      let sig_string = to_signature_string(signature);

      await bridge_logic_instance.set_deposit_maximum(test_token_instance.address, "500", nonce, sig_string);

      //Get maximum deposit, should be updated
      deposit_maximum = (await bridge_logic_instance.get_deposit_maximum(test_token_instance.address)).toString();
      assert.equal(deposit_maximum, "500", "deposit min should be 500, isn't");

      //deposit less that min should fail
      try{
        await deposit_asset(bridge_logic_instance, test_token_instance, "501");
        assert.equal(
            true,
            false,
            "token deposit worked, shouldn't have"
        );
      } catch(e){}

      //deposit more that min should work
      await deposit_asset(bridge_logic_instance, test_token_instance, accounts[0], "499");
    });
});

contract("ERC20_Bridge_Logic Function: deposit_asset",   (accounts) => {
    //function deposit_asset(address asset_source, uint256 asset_id, uint256 amount, bytes32 vega_public_key) public;

    it("deposit_asset should fail due to asset not being listed", async () => {
      let bridge_logic_instance = await ERC20_Bridge_Logic.deployed();
      let test_token_instance = await Base_Faucet_Token.deployed();

      //try to deposit asset, fails
      assert.equal(
          await bridge_logic_instance.is_asset_listed(test_token_instance.address),
          false,
          "token is listed, shouldn't be"
      );

      try{
        await deposit_asset(bridge_logic_instance, test_token_instance, "1");
        assert.equal(
            true,
            false,
            "token deposit worked, shouldn't have"
        );
      } catch(e){}

    });
    it("happy path - should allow listed asset to be deposited", async () => {
      let bridge_logic_instance = await ERC20_Bridge_Logic.deployed();
      let test_token_instance = await Base_Faucet_Token.deployed();

      //list asset
      list_asset(bridge_logic_instance, accounts[0]);

      assert.equal(
          await bridge_logic_instance.is_asset_listed(test_token_instance.address),
          true,
          "token isn't listed, should be"
      );

      //deposit asset
      await deposit_asset(bridge_logic_instance, test_token_instance, accounts[0]);
    });
});

contract("ERC20_Bridge_Logic Function: withdraw_asset",   (accounts) => {
    //function withdraw_asset(address asset_source, uint256 asset_id, uint256 amount, uint256 expiry, uint256 nonce, bytes memory signatures) public;

    it("happy path - should allow withdrawal from a generated withdraw ticket signed by MultisigControl", async () => {
      let bridge_logic_instance = await ERC20_Bridge_Logic.deployed();
      let test_token_instance = await Base_Faucet_Token.deployed();
      let asset_pool_instance = await ERC20_Asset_Pool.deployed();
      //list asset
      try {
        await list_asset(bridge_logic_instance, accounts[0]);
      } catch(e){/*ignore if already listed*/}

      //new asset ID is listed
      assert.equal(
          await bridge_logic_instance.is_asset_listed(test_token_instance.address),
          true,
          "token isn't listed, should be"
      );

      await set_bridge_address(bridge_logic_instance, asset_pool_instance, accounts[0]);

      //deposit asset
      await deposit_asset(bridge_logic_instance, test_token_instance, accounts[0]);

      let account_bal_before = await test_token_instance.balanceOf(accounts[0]);
      let pool_bal_before = await test_token_instance.balanceOf(asset_pool_instance.address);

      //withdraw asset
      await withdraw_asset(bridge_logic_instance, test_token_instance, accounts[0], false, false);

      let account_bal_after = await test_token_instance.balanceOf(accounts[0]);
      let pool_bal_after = await test_token_instance.balanceOf(asset_pool_instance.address);

      assert.equal(
          account_bal_before.add(pool_bal_before).toString(),
          account_bal_after.toString(),
          "account balance didn't go up"
      );

      assert.equal(
          pool_bal_after.toString(),
          "0",
          "pool should be empty, isn't"
      );

    });
    it("withdraw_asset fails due to expired withdrawal order", async () => {
      let bridge_logic_instance = await ERC20_Bridge_Logic.deployed();
      let test_token_instance = await Base_Faucet_Token.deployed();
      let asset_pool_instance = await ERC20_Asset_Pool.deployed();
      //list asset
      try {
        await list_asset(bridge_logic_instance, accounts[0]);
      } catch(e){/*ignore if already listed*/}

      //new asset ID is listed
      assert.equal(
          await bridge_logic_instance.is_asset_listed(test_token_instance.address),
          true,
          "token isn't listed, should be"
      );

      await set_bridge_address(bridge_logic_instance, asset_pool_instance, accounts[0]);

      //deposit asset
      await deposit_asset(bridge_logic_instance, test_token_instance, accounts[0]);

      //withdraw asset
      try{
        await withdraw_asset(bridge_logic_instance, test_token_instance, accounts[0], true, false);
        assert.equal(
            true,
            false,
            "expired withdrawal worked, shouldn't have"
        );
      } catch(e){}

    });
    it("withdraw_asset fails due to amount mismatch between signature and function params", async () => {
      let bridge_logic_instance = await ERC20_Bridge_Logic.deployed();
      let test_token_instance = await Base_Faucet_Token.deployed();
      let asset_pool_instance = await ERC20_Asset_Pool.deployed();
      //list asset
      try {
        await list_asset(bridge_logic_instance, accounts[0]);
      } catch(e){/*ignore if already listed*/}

      //new asset ID is listed
      assert.equal(
          await bridge_logic_instance.is_asset_listed(test_token_instance.address),
          true,
          "token isn't listed, should be"
      );

      await set_bridge_address(bridge_logic_instance, asset_pool_instance, accounts[0]);

      //deposit asset
      await deposit_asset(bridge_logic_instance, test_token_instance, accounts[0]);

      //withdraw asset
      try{
        await withdraw_asset(bridge_logic_instance, test_token_instance, accounts[0], false, true);
        assert.equal(
            true,
            false,
            "pad params withdrawal worked, shouldn't have"
        );
      } catch(e){}
    });
    //NOTE signature tests are covered in MultisigControl
});


/////VIEWS
contract("ERC20_Bridge_Logic Function: is_asset_listed",   (accounts) => {
    //function is_asset_listed(address asset_source, uint256 asset_id) public view returns(bool);

    it("asset is listed after 'list_asset'", async () => {
      let bridge_logic_instance = await ERC20_Bridge_Logic.deployed();
      let test_token_instance = await Base_Faucet_Token.deployed();
      let asset_pool_instance = await ERC20_Asset_Pool.deployed();
      //new asset ID is listed
      assert.equal(
          await bridge_logic_instance.is_asset_listed(test_token_instance.address),
          false,
          "token listed, shouldn't be"
      );
      //list asset
      await list_asset(bridge_logic_instance, accounts[0]);

      //new asset ID is listed
      assert.equal(
          await bridge_logic_instance.is_asset_listed(test_token_instance.address),
          true,
          "token isn't listed, should be"
      );
    });
    it("asset is not listed after 'remove_asset'", async () => {
      let bridge_logic_instance = await ERC20_Bridge_Logic.deployed();
      let test_token_instance = await Base_Faucet_Token.deployed();
      let asset_pool_instance = await ERC20_Asset_Pool.deployed();
      //new asset ID is listed
      assert.equal(
          await bridge_logic_instance.is_asset_listed(test_token_instance.address),
          true,
          "token not listed, should be"
      );
      //list asset
      await remove_asset(bridge_logic_instance, accounts[0]);

      //new asset ID is listed
      assert.equal(
          await bridge_logic_instance.is_asset_listed(test_token_instance.address),
          false,
          "token is listed, shouldn't be"
      );
    });
});

contract("ERC20_Bridge_Logic Function: get_deposit_minimum",   (accounts) => {
    //function get_deposit_minimum(address asset_source, uint256 asset_id) public view returns(uint256);

    it("minimum deposit updates after set_deposit_minimum", async () => {
      let bridge_logic_instance = await ERC20_Bridge_Logic.deployed();
      let test_token_instance = await Base_Faucet_Token.deployed();

      //Get minimum deposit
      let deposit_minimum = (await bridge_logic_instance.get_deposit_minimum(test_token_instance.address)).toString();
      assert.equal(deposit_minimum,"0", "deposit min should be zero, isn't");

      try {
        await list_asset(bridge_logic_instance, accounts[0]);
      } catch(e){/*ignore if already listed*/}

      //new asset ID is listed
      assert.equal(
          await bridge_logic_instance.is_asset_listed(test_token_instance.address),
          true,
          "token isn't listed, should be"
      );

      //Set minimum deposit
      //NOTE signature tests are in MultisigControl
      let nonce = new ethUtil.BN(crypto.randomBytes(32));
      let encoded_message = get_message_to_sign(
          ["address", "uint256"],
          [test_token_instance.address, "500"],
          nonce,
          "set_deposit_minimum",
          ERC20_Bridge_Logic.address);
      let encoded_hash = ethUtil.keccak256(encoded_message);

      let signature = ethUtil.ecsign(encoded_hash, private_keys[accounts[0].toLowerCase()]);
      let sig_string = to_signature_string(signature);

      await bridge_logic_instance.set_deposit_minimum(test_token_instance.address, "500", nonce, sig_string);

      //Get minimum deposit, should be updated
      deposit_minimum = (await bridge_logic_instance.get_deposit_minimum(test_token_instance.address)).toString();
      assert.equal(deposit_minimum, "500", "deposit min should be 500, isn't");
    });
});
contract("ERC20_Bridge_Logic Function: get_multisig_control_address",   (accounts) => {
    //function get_multisig_control_address() public view returns(address);
    it("get_multisig_control_address returns the address it was initialized with", async () => {
      let bridge_logic_instance = await ERC20_Bridge_Logic.deployed();
      let test_token_instance = await Base_Faucet_Token.deployed();
      let asset_pool_instance = await ERC20_Asset_Pool.deployed();

      let multisig_control_address = await bridge_logic_instance.get_multisig_control_address();
      assert.equal(multisig_control_address, MultisigControl.address, "Multisig control shows the wrong address");
    });
});
contract("ERC20_Bridge_Logic Function: get_vega_asset_id",  (accounts) => {
    //function get_vega_asset_id(address asset_source) public view returns(bytes32);
    it("get_vega_asset_id returns proper vega id for newly listed assets", async () => {
      let bridge_logic_instance = await ERC20_Bridge_Logic.deployed();
      let test_token_instance = await Base_Faucet_Token.deployed();
      //new asset ID is not listed
      assert.equal(
          await bridge_logic_instance.is_asset_listed(bridge_addresses.test_token_address),
          false,
          "token is listed, shouldn't be"
      );

      //non listed asset should fail vega_asset_id
      let vega_asset_id = await bridge_logic_instance.get_vega_asset_id(test_token_instance.address);

      assert.equal(vega_asset_id, "0x0000000000000000000000000000000000000000000000000000000000000000", "Asset has already been listed, shouldn't be")
      await list_asset(bridge_logic_instance, accounts[0]);
      //new asset ID is listed
      assert.equal(
          await bridge_logic_instance.is_asset_listed(test_token_instance.address),
          true,
          "token isn't listed, should be"
      );
      vega_asset_id = await bridge_logic_instance.get_vega_asset_id(test_token_instance.address);
      assert.equal(vega_asset_id, ("0x" + new_asset_id.toString("hex")), "listed asset returns incorrect address")

    });

    it("get_vega_asset_id returns vega id 0x00... for unknown assets", async () => {
      let bridge_logic_instance = await ERC20_Bridge_Logic.deployed();

      assert.equal(
          await bridge_logic_instance.is_asset_listed(accounts[3]),
          false,
          "token is listed, shouldn't be"
      );

      //non listed asset should fail vega_asset_id
      let vega_asset_id = await bridge_logic_instance.get_vega_asset_id(accounts[3]);

      assert.equal(vega_asset_id, "0x0000000000000000000000000000000000000000000000000000000000000000", "Asset has already been listed, shouldn't be")

    });
});

contract("ERC20_Bridge_Logic Function: get_asset_source",   (accounts) => {

    it("get_asset_source returns proper values for newly listed asset", async () => {
      let bridge_logic_instance = await ERC20_Bridge_Logic.deployed();
      let test_token_instance = await Base_Faucet_Token.deployed();
      //new asset ID is not listed
      assert.equal(
          await bridge_logic_instance.is_asset_listed(bridge_addresses.test_token_address),
          false,
          "token is listed, shouldn't be"
      );

      //non listed asset should fail get_asset_source
      let asset_source = await bridge_logic_instance.get_asset_source("0x"+ new_asset_id.toString("hex"));
      assert.equal(asset_source, "0x0000000000000000000000000000000000000000", "Asset has already been listed, shouldn't be")
      await list_asset(bridge_logic_instance, accounts[0]);
      //new asset ID is listed
      assert.equal(
          await bridge_logic_instance.is_asset_listed(test_token_instance.address),
          true,
          "token isn't listed, should be"
      );
      asset_source = await bridge_logic_instance.get_asset_source("0x" + new_asset_id.toString("hex"));
      assert.equal(asset_source, test_token_instance.address, "listed asset returns incorrect address")
    });

    it("get_asset_source_and_asset_id fails to return for unknown assets", async () => {
      let bridge_logic_instance = await ERC20_Bridge_Logic.deployed();
      let test_token_instance = await Base_Faucet_Token.deployed();
      let bad_asset = crypto.randomBytes(32);
      //new asset ID is not listed
      assert.equal(
          await bridge_logic_instance.is_asset_listed(accounts[0]),
          false,
          "token is listed, shouldn't be"
      );

      //non listed asset should fail get_asset_source
      let asset_source = await bridge_logic_instance.get_asset_source("0x"+ bad_asset.toString("hex"));
      assert.equal(asset_source, "0x0000000000000000000000000000000000000000", "Asset has already been listed, shouldn't be");

    });
});
