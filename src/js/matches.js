App = {
  web3Provider: null,
  contracts: {},
  sortMethod: 0,


  init: function() {
    const Status = Object.freeze({
      NOTFOUND:   0,
      PLAYING:  1,
      PROCESSING: 2,
      PAYING: 3,
      CANCELING: 4
  });    
    // Load pets.
    $.getJSON('../matches.json', function(data) {
      var gamesRow = $('#gamesRow');
      var gameTemplate = $('#gameTemplate');

      for (i = 0; i < data.length; i ++) {
        
        startTime = new Date(data[i].StartTime*1000).toISOString();
        startTimeDisplay = 'StartTime:'+startTime.substring(0, 10)+' '+startTime.substring(11, 19);
        timeStopBuy = 'Deadline to Enter:'+startTime.substring(0, 10)+' '+startTime.substring(11, 19);
        gameTemplate.find('#teamA').attr('src', data[i].TeamAPicture);
        gameTemplate.find('#teamB').attr('src', data[i].TeamBPicture);

        gameTemplate.find('.date').text(startTimeDisplay);
        gameTemplate.find('.pointSpread').text(data[i].PointSpread);
        gameTemplate.find('#timeStopBuy').text(timeStopBuy);
        gameTemplate.find('.game-block__bottom').attr('game-id', data[i].matchID);
        gameTemplate.find('.btn-bet').attr('data-id', data[i].matchID);
        gamesRow.append(gameTemplate.html());
      }
    });

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
var account = $('#account');
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
        real_balance = Math.round(result/10000000000000000)/100;
        
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
    var TGCbalance = $('#TGCbalance');
    if(result){
    tgc_balance = Math.round(result/10000000000000000)/100;
    }else{
      tgc_balance = 0;
    }       
    TGCbalance.append(tgc_balance);
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

  initContract: function() {

    $.getJSON('../ItemToken.json', function(data) {
      // Get the necessary contract artifact file and instantiate it with truffle-contract
      var AdoptionArtifact = data;
      App.contracts.ItemToken = TruffleContract(AdoptionArtifact);

      // Set the provider for our contract
      App.contracts.ItemToken.setProvider(App.web3Provider);

      // Use our contract to retrieve and mark the adopted pets
      App.markAdopted();
    });


      
    $.getJSON('../TTGOracle.json', function(data) {
      // Get the necessary contract artifact file and instantiate it with truffle-contract
      var AdoptionArtifact = data;
      App.contracts.TTGOracle = TruffleContract(AdoptionArtifact);

      // Set the provider for our contract
      App.contracts.TTGOracle.setProvider(App.web3Provider);

      App.contracts.TTGOracle.deployed().then(function(instance) {
        ttgInstance = instance;
        return ttgInstance.getStatLotteries();
      }).then(function(items){
          gameCount = parseInt(items[0].toString());
          console.log('gameCount =', gameCount);
          playingCount = parseInt(items[1].toString());
          console.log('playingCount =', playingCount);
          processingCount = parseInt(items[2].toString());
          console.log('processingCount =', processingCount);
          playinglist = items[3].toString();
          console.log('playinglist =', playinglist);
          processinglist = parseInt(items[4].toString());
          console.log('processinglist =', processinglist);

          for(gameID = 0; gameID < gameCount; gameID++){
            ttgInstance.getLotteryByID(gameID).then(function(lottery){
              gameIDCallBack = parseInt(lottery[3].toString());
              console.log('gameID =', gameIDCallBack);
              gameName = lottery[0].toString();
              console.log('gameName =', gameName);
              gameCountCombinations =   parseInt(lottery[1].toString());
              console.log('gameCountCombinations =', gameCountCombinations);
              dateStopBuy = new Date(parseInt(lottery[2].toString())*1000).toISOString();
              dateStopBuyDay = dateStopBuy.substring(0, 10);
              dateStopBuyTime = dateStopBuy.substring(11, 19);
              console.log('dateStopBuy =', dateStopBuy);           
              console.log('dateStopBuyDay =', dateStopBuyDay);
              console.log('dateStopBuyTime =', dateStopBuyTime);
              minStake =   parseInt(lottery[6].toString());
              console.log('minStake =', minStake);  
              winCombination =   parseInt(lottery[7].toString());
              console.log('winCombination =', winCombination);                                 
              betsCount =   parseInt(lottery[8].toString());
              console.log('betsCount =', betsCount);  
              betsSumIn =   parseInt(lottery[9].toString());
              betsSumIn = Math.round(betsSumIn/100000000000000)/10000;             
              console.log('betsSumIn =', betsSumIn);  
              feeValue =   parseInt(lottery[10].toString());
              console.log('feeValue =', feeValue);  
              status =   lottery[11];
              console.log('status =', status);  
              isFreezing =  lottery[12];
              console.log('isFreezing =', isFreezing);         
              //TODO: need to add gameID to blockchain
              $(".game-block__bottom[game-id='"+gameIDCallBack+"']").find('.SmartContractValue').text(betsSumIn);
              //if playing, disable redeem button
              if(status == 1){
                $(".btn-redeem[game-id='"+gameIDCallBack+"']").disabled = true;                  
              }               
              else if(status == 3){
                $(".btn-redeem[game-id='"+gameIDCallBack+"']").disabled = false;      
              }                                                

            })
          };

          
      });
      // Use our contract to retrieve and mark the adopted pets
      //App.markAdopted();
    });


  return App.bindEvents();
  },

  bindEvents: function() {
    $(document).on('click', '.btn-bet', App.handleBet);
    $(document).on('click', '.btn-redeem', App.handleRedeem);    
    $(document).on('click', '.PriceDescending', App.PriceDescending); 
  },

  

  PriceAscending: function(){
  var ascending = false;
  var convertToNumber = function(value){
       return parseFloat(value);
  };
  //App.markAdopted();
  App.sortMethod = 1;
   console.log('PriceAscending button onclick ');
   var items = $('#petsRow').find('.col-lg-3');
    var sorted = items.sort(function(a,b){
        return (ascending ==
               (convertToNumber($(a).find('#pricespan').html()) < 
                convertToNumber($(b).find('#pricespan').html()))) ? 1 : -1;
    });
    //ascending = ascending ? false : true;

    $('#petsRow').append(sorted);    

  },

  PriceDescending: function(){
  var ascending = true;
  var convertToNumber = function(value){
       return parseFloat(value);
  };  
  App.sortMethod = 2;
   console.log('PriceDescending button onclick ');
   var items = $('#petsRow').find('.col-lg-3');
    var sorted = items.sort(function(a,b){
        return (ascending ==
               (convertToNumber($(a).find('#pricespan').html()) < 
                convertToNumber($(b).find('#pricespan').html()))) ? 1 : -1;
    });
    //ascending = ascending ? false : true;

    $('#petsRow').append(sorted);    

  },

  handleRedeem:function(){
    var matchIDOnRedeem = parseInt($(event.target).data('id'));
    console.log('$(event.target).data(id) =', matchIDOnRedeem);

      App.contracts.TTGOracle.deployed().then(function(instance) {
        ttgInstance = instance;
        //return ttgInstance.getUserTokens($('#account').text());
      //}).then(function(items){
        //var ticketsArray = items.spilt(',');
        //ticketsArray.forEach(element => {
          //ttgInstance.getTokenByID(parseInt(element)).then(function(callback){
          //  console.log('callback[4]',callback[4])
          //  console.log('callback[5]',callback[5])
          //  if(callback[4] == matchIDOnRedeem){
              return ttgInstance.redeemToken(10);
          //  }
          //})
        //});
      });
  },

  markAdopted: function(adopters, account) {

  },

  handleBet: function(event) {
    event.preventDefault();

    var matchIDOnBet = parseInt($(event.target).data('id'));
    console.log('$(event.target).data(id) =', matchIDOnBet);


    var itemValueString =  $(event.target).parent().find('.Price').text();

    console.log("value selected item string =", itemValueString );

    var itemValue = parseFloat(itemValueString);    

    itemValue = web3.toWei(0.2, 'ether');

    console.log("value selected item =", itemValue );    

    var TTGOracleInstance;

web3.eth.getAccounts(function(error, accounts) {
  if (error) {
    console.log(error);
  }

  var account = accounts[0];
  var teamIDOnBet = 0;
  $.getJSON('../matches.json', function(data) {
//    for (gameID =0; gameID <data.length; gameID++){
//      if(data[i].matchID == matchIDOnBet){
        //console.log('matches.json:', data);
        teamIDOnBet = data[matchIDOnBet].TeamA;
        console.log('teamIDOnBet 1=', teamIDOnBet);
        App.contracts.TTGOracle.deployed().then(function(instance) {
          TTGOracleInstance = instance;
          
          console.log('matchIDOnBet =', matchIDOnBet);
          console.log('teamIDOnBet 2=', teamIDOnBet);
          // Execute adopt as a transaction by sending account
          return TTGOracleInstance.buyToken(matchIDOnBet, teamIDOnBet, 2, 0, {from: account, gas: 2000000, value: itemValue});
        }).then(function(result) {
          alert("Congratulations! You have bought a ticket for your team now!");    
          //return App.markAdopted(); 
        }).catch(function(err) {
          alert("Oops, we have an error here", error);
          console.log(err.message);
        });
//      }
//    }
    

  });
});
  }

};

$(function() {
  $(window).load(function() {    
    //var sortMethod = 0;
    App.init();
  });
});
