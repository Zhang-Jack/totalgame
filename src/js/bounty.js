App = {
  web3Provider: null,
  contracts: {},
  sortMethod: 0,
  isFirstLoad: 1,
  syncSucceed: false,
  vueContainer: null,
  account:null,

  init: function() {
    App.vueContainer = new Vue({
      el: "#captain_link",
      data:{
        account: null,
        message: null,
      },
      methods:{
        copyToClipboard: function(){
          console.log(App.vueContainer.message);
          var $temp = $("<input>");
          $("body").append($temp);
          $temp.val(App.vueContainer.message).select();
          document.execCommand("copy");
          $temp.remove();
        },
        alertToLogin: function(){
          alert('Please install MetaMask and login firstly');
        }
      }
    })
    return App.initWeb3();
  },

  initWeb3: function() {
    // Is there an injected web3 instance?
if (typeof web3 !== 'undefined') {
  App.web3Provider = web3.currentProvider;
} else {
  // If no injected web3 instance is detected, fall back to Ganache
  App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
}
web3 = new Web3(App.web3Provider);
var defaultAccount = web3.eth.defaultAccount;
console.log('defaultAccount =',defaultAccount); 
App.vueContainer.account = defaultAccount;
App.vueContainer.message ="https://totalgame.io/dapp/matches.html?captain="+defaultAccount;
var account = $('#account');
App.account = defaultAccount;
var display_owner = defaultAccount.toString().substring(2,42);
      display_owner = display_owner.toUpperCase(display_owner);
      display_owner = "0x"+display_owner;
account.append(display_owner);
var balance = $('#balance');
var real_balance =0.0;
if(!defaultAccount || defaultAccount==null){
  window.location.replace("../dapp/install_tutorial.html");
}
if(defaultAccount) real_balance = web3.eth.getBalance(defaultAccount, function(error, result){
    if(!error){
        real_balance = Math.round(result/100000000000000)/10000;
        
        console.log(JSON.stringify(result));
        balance.append(real_balance);
    }
    else
        console.error(error);
});

$.getJSON('../TTGCoin.json', function(data){
  var TTGCoinArtifact = data;
  App.contracts.TTGCoin = TruffleContract(TTGCoinArtifact);
  App.contracts.TTGCoin.setProvider(App.web3Provider);
  App.contracts.TTGCoin.deployed().then(function(instance){
    var ttgCoinInstance = instance;
    return ttgCoinInstance.balanceOf(defaultAccount);
  }).then(function(result){
    var TTGbalance = $('#TTGbalance');
    if(result){
    tgc_balance = Math.round(result/10000000000000000)/100;
    }else{
      tgc_balance = 0;
    }       
    TTGbalance.append(tgc_balance);
  });        
});

web3.eth.filter('latest', function(error, result){
  if (!error)
    console.log(result);
  else
    console.log(error);  
});

    return App.initContract();
  },

  getAirDrop:function(){
    if(!App.account) {
      alert('Please install MetaMask and login firstly');
      return;
    }
    $.getJSON('../TTGLottery.json', function(data){
      var LotteryArtifact = data;
      App.contracts.TTGLottery = TruffleContract(LotteryArtifact);
      App.contracts.TTGLottery.setProvider(App.web3Provider);
      App.contracts.TTGLottery.deployed().then(function(instance){
        var ttgLotteryInstance = instance;
        return ttgLotteryInstance.airDrop();
      }).then(function(result){  
        console.log('airDrop succeed');
        alert("Congratulations! 100 TTG has been sent to your wallet!");
         
    }).catch(function(err) {
        alert("Oops, we have an error here");
        console.log('err',err);
            
      });
    });
  },

  initContract: function() {

  }

};

$(function() {
  $(window).load(function() {    
    //var sortMethod = 0;
    App.init();
  });
});
