var TTGToken = artifacts.require("./TTGToken.sol");

module.exports = function(deployer) { 
  deployer.deploy(TTGToken);
};