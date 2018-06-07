App = {
  web3Provider: null,
  contracts: {},
  sortMethod: 0,
  isFirstLoad: 1,
  syncSucceed: false,
  defaultAccount: null,
  showContent: 1,
  ticketsCount: 0,  
  ttgOracleInstance: null,
  ttgCoinInstance: null,
  vueContainer: new Vue(),
  matchesData: null,
  

  init: function() {    
    if(App.isFirstLoad){
      $.LoadingOverlay("show",{
        background  : "rgba(255, 255, 255, 0.0)",
        imageColor  : "#EFA330"            
      });   
      setTimeout(function(){
          $.LoadingOverlay("hide");
          if(!App.syncSucceed){
            alert("Syncing failed, please reload this page later")
          }
        }, 60000); 
      App.isFirstLoad = 0;
  }    
  $.getJSON('../matches.json', function(data){
    App.matchesData = data;  
  });
  
  App.vueContainer = new Vue({
    el: '#ticketsContainer',
    data: {      
    betDataList: [],
    ticketsCount: 0,
    showContent: 1,
    },
    computed: {
      betList: function() {
          let list = []
          this.betDataList.forEach(element => {
              element.pickedPurchaseDateStr = new Date(element.pickedPurchaseDate * 1000).toISOString()
              element.pickedPurchaseDateStr = element.pickedPurchaseDateStr.substring(0, 10) + ' ' + element.pickedPurchaseDateStr.substring(11, 19)
              list.push(element)
          });
          console.log('betList',list);
          return list;                        
        },
    },
  methods: {
    gotoDetails(item) {
      console.log(item);
      let url = "matchesDetail.html?TeamA=" + item.TeamA + "&TeamB=" + item.TeamB + "&Group=" + item.Group +"&matchID="+ item.matchID +"&TeamAID=" +item.TeamAID+"&TeamBID=" +item.TeamBID;      
      console.log(url);
      window.location.href = url;
    },
    testForClick: function(){
      console.log('test For Click');
    }      
  }
  });
    return App.initWeb3();
  },

  gotoDetail: function(item) {
    console.log(item);
    let url = "matchesDetail.html?TeamA=" + item.TeamA + "&TeamB=" + item.TeamB + "&Group=" + item.Group +"&matchID="+ item.matchID +"&TeamAID=" +item.TeamAID+"&TeamBID=" +item.TeamBID;      
    console.log(url);
    window.location.href = url;
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
account.append(defaultAccount);
var balance = $('#balance');
var real_balance =0.0;
App.defaultAccount = defaultAccount;
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
    App.ttgCoinInstance = instance;
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
  App.readTickets();
        


web3.eth.filter('latest', function(error, result){
  if (!error)
    console.log(result);
  else
    console.log(error);  
});



    return App.initContract(defaultAccount );
  },

  readTickets: function(){
    $.getJSON('../TTGOracle.json', function(data){
      var TTGOracleArtifact = data;
      App.contracts.TTGOracle = TruffleContract(TTGOracleArtifact);
      App.contracts.TTGOracle.setProvider(App.web3Provider);
      App.contracts.TTGOracle.deployed().then(function(instance){
        var ttgOracleInstance = instance;
        App.ttgOracleInstance = instance;
        console.log('calling ttgOracleInstance.getUserTokens');
        return ttgOracleInstance.getUserTokens(App.defaultAccount, 0);
      }).then(function(result){
        //if(result){
          console.log('result =', result);
          var tickets = result.toString().split(",");
          App.ticketsCount = tickets.length;
          App.vueContainer.ticketsCount = tickets.length;
          tickets.forEach(ticket =>{
            App.ttgOracleInstance.getTokenByID(parseInt(ticket)).then(function(data){                 
              info= {pickedTeam: "",
              pickedTeamID: 0,
              pickedTeamPicture: "",
              pickedBetAmount: 0.005,               
              pickedPurchaseDate: 1527988400,          
              pickedPayMent: 0,
              pickedHasPayed: true,
              tokenID: 0,
              TeamA: "",
              TeamAID: 0,
              TeamB: "",
              TeamBID: 1,
              Group: "",
              matchID: 0          
               };
               info.TeamA = App.matchesData[parseInt(data[4])].TeamA;
               info.TeamAID = App.matchesData[parseInt(data[4])].TeamAID;
               info.TeamB = App.matchesData[parseInt(data[4])].TeamB;
               info.TeamBID = App.matchesData[parseInt(data[4])].TeamBID;
               info.Group =App.matchesData[parseInt(data[4])].Group;
               info.matchID = App.matchesData[parseInt(data[4])].matchID;
              if(data[2] == 1){
                  info.pickedTeam = App.matchesData[parseInt(data[4])].TeamA;
                  info.pickedTeamID = App.matchesData[parseInt(data[4])].TeamAID;
                  info.pickedTeamPicture = App.matchesData[parseInt(data[4])].TeamAPicture;                                
                  info.pickedBetAmount = Math.round(parseInt(data[0].toString())/100000000000000)/10000;
                  info.pickedPurchaseDate = parseInt(data[3].toString());                             
    
              }else if(data[2] == 2){
                  info.pickedTeam = App.matchesData[parseInt(data[4])].TeamB;
                  info.pickedTeamID = App.matchesData[parseInt(data[4])].TeamBID;
                  info.pickedTeamPicture = App.matchesData[parseInt(data[4])].TeamBPicture;
                  info.pickedBetAmount = Math.round(parseInt(data[0].toString())/100000000000000)/10000;
                  info.pickedPurchaseDate = parseInt(data[3].toString());                             
                  
              }    
              info.pickedOtherNum = App.betsAllCount > 0? (App.betsAllCount-1):0;
              sameComboBetsAmount = Math.round(parseInt(data[7].toString())/100000000000000)/10000;
    
              // info.pickedFactor = App.vueContainer.gameGroup.Contract_Value/sameComboBetsAmount;
              // info.pickedEstimatedWin = (info.pickedBetAmount/sameComboBetsAmount*App.vueContainer.gameGroup.Contract_Value).toFixed(4);
              info.pickedPayMent = Math.round(parseInt(data[1].toString())/100000000000000)/10000;
              info.pickedHasPayed = data[6];
              info.tokenID = parseInt(data[8].toString());
              console.log('info.pickedHasPayed', info.pickedHasPayed);
              App.vueContainer.betDataList.push(info);
              // App.vueContainer.betList.push(info);
              App.syncSucceed = true;
              $.LoadingOverlay("hide");
            });
          });        
        });
      });
  },

  initContract: function(defaultAccount) {
$.getJSON('../ItemToken.json', function(data) {
  // Get the necessary contract artifact file and instantiate it with truffle-contract
  var AdoptionArtifact = data;
  App.contracts.ItemToken = TruffleContract(AdoptionArtifact);

  // Set the provider for our contract
  App.contracts.ItemToken.setProvider(App.web3Provider);

App.contracts.ItemToken.deployed().then(function(instance) {
  adoptionInstance = instance;
  console.log('initContract entered');
  return adoptionInstance.tokensOf(defaultAccount);
}).then(function(items) {
      // Load pets.  
      $.getJSON('../pets.json', function(data) {
        var myPetsRow = $('#myPetsRow');
        var myPetTemplate = $('#myPetTemplate');
        items.forEach(function(item){

            myPetTemplate.find('.panel-title').text(data[parseInt(item)].name);
            myPetTemplate.find('img').attr('src', data[parseInt(item)].picture);
            myPetTemplate.find('.Price').text(data[parseInt(item)].Price);        
            myPetTemplate.find('.panel-pet').attr('panel-id', data[parseInt(item)].id);
            myPetsRow.append(myPetTemplate.html());
      });
      });
    });

  // Use our contract to retrieve and mark the adopted pets
  return App.markAdopted();
});
    return App.bindEvents();
  },

  bindEvents: function() {
    $(document).on('click', '.btn-adopt', App.handleAdopt);
    $(document).on('click', '.PriceAscending', App.PriceAscending);    
    $(document).on('click', '.PriceDescending', App.PriceDescending); 
  },

  showMyTeams: function(){
    if(App.showContent == 1) return App.markAdopted();
    App.showContent = 1;
    App.vueContainer.showContent = 1;
    $('li').removeClass('active');
    $('.mine-tab').addClass('active');    
    $('.teams-tab').addClass('active');
    $('#top-banner').find('.banner-text').text('Teams of Mine');

    App.contracts.ItemToken.deployed().then(function(instance) {
      adoptionInstance = instance;
      console.log('showMyTeams entered');
      return adoptionInstance.tokensOf(App.defaultAccount);
    }).then(function(items) {
            // Load pets.  
    $.getJSON('../pets.json', function(data) {
    var myPetsRow = $('#myPetsRow');
    var myPetTemplate = $('#myPetTemplate');
    myPetsRow.html("");
    items.forEach(function(item){
              
          myPetTemplate.find('.panel-title').text(data[parseInt(item)].name);
          myPetTemplate.find('img').attr('src', data[parseInt(item)].picture);
          myPetTemplate.find('.Price').text(data[parseInt(item)].Price);        
          myPetTemplate.find('.panel-pet').attr('panel-id', data[parseInt(item)].id); 
          myPetsRow.append(myPetTemplate.html());
        
      });
    });
    return App.markAdopted();
    });
  },

  showMyTickets: function(){
    if(App.showContent == 2) return;
    App.showContent = 2;
    App.vueContainer.showContent = 2;
    $('li').removeClass('active');
    $('.mine-tab').addClass('active');    
    $('.tickets-tab').addClass('active');
    $('#top-banner').find('.banner-text').text('Tickets of Mine');
    var myPetsRow = $('#myPetsRow');
    myPetsRow.html("");
    var ticketsTemplate;
    if(!App.ticketsCount)App.readTickets();
    console.log('App.ticketsCount',App.ticketsCount);
    if(!App.ticketsCount){
    ticketsTemplate = $('#emptyContainer');        
    }
    else{
    // ticketsTemplate = $('#ticketsContainer');
    // console.log(App.vueContainer.betList);
    }
    myPetsRow.append(ticketsTemplate.html());
  },

  UpdateContent: function(){
    if(App.showContent == 1){
      App.showMyTeams();
    }else if(App.showContent == 2){
      App.showMyTickets();
    }
  },

  PriceAscending: function(){
  var ascending = false;
  var convertToNumber = function(value){
       return parseFloat(value);
  };
  //App.markAdopted();
  App.sortMethod = 1;
   console.log('PriceAscending button onclick ');
   var items = $('#myPetsRow').find('.col-lg-3');
    var sorted = items.sort(function(a,b){
        return (ascending ==
               (convertToNumber($(a).find('#pricespan').html()) < 
                convertToNumber($(b).find('#pricespan').html()))) ? 1 : -1;
    });
    //ascending = ascending ? false : true;

    $('#myPetsRow').append(sorted);    

  },

  PriceDescending: function(){
  var ascending = true;
  var convertToNumber = function(value){
       return parseFloat(value);
  };  
  App.sortMethod = 2;
   console.log('PriceDescending button onclick ');
   var items = $('#myPetsRow').find('.col-lg-3');
    var sorted = items.sort(function(a,b){
        return (ascending ==
               (convertToNumber($(a).find('#pricespan').html()) < 
                convertToNumber($(b).find('#pricespan').html()))) ? 1 : -1;
    });
    //ascending = ascending ? false : true;

    $('#myPetsRow').append(sorted);    

  },


  markAdopted: function(adopters, account) {
var adoptionInstance;

App.contracts.ItemToken.deployed().then(function(instance) {
  adoptionInstance = instance;
  console.log('markAdopted entered');
  return adoptionInstance.itemsForSaleLimit(0, 129);
}).then(function(items) {
  for (i = 0; i <=items.length; i++) {
      //console.log("adopters != null, i =", i);

      adoptionInstance.allOf(i).then(function(Promise, sortMethod){            
      onchain_Price = Math.ceil(web3.fromWei(Promise[3], 'ether')*10000)/10000;
      var n = onchain_Price.toString(); 
      //console.log('panel-pet =',$('.panel-pet'));
      //console.log('panel-id =', $('#panel-id'));  
      var display_owner = Promise[1].toString().substring(2,8)+"..."+Promise[1].toString().substring(34,42);
      display_owner = display_owner.toUpperCase(display_owner);
      display_owner = "0x"+display_owner;
       $(".panel-pet[panel-id='"+Promise[0]+"']").find('.owner').text(display_owner);  
      var first_6_digit ="#"+Promise[1].toString().substring(2,8);
      //console.log('first_6_digit =',first_6_digit);
      if( $(".panel-pet[panel-id='"+Promise[0]+"']").find('.panel-heading')){
        //console.log('panel body found');
         $(".panel-pet[panel-id='"+Promise[0]+"']").find('.panel-heading').css("background-color",first_6_digit);
      }
      $(".panel-pet[panel-id='"+Promise[0]+"']").find('.Price').text(n);
      
      if(Promise[0] == items.length && App.sortMethod == 1){
        console.log('calling App.PriceAscending()', App.sortMethod);
        App.PriceAscending();
      }else if(Promise[0] == items.length && App.sortMethod == 2){
        console.log('calling App.PriceDescending()',App.sortMethod);
        App.PriceDescending();
      }
      // }else
         //console.log('sortMethod =',App.sortMethod);
      
      
      });
      
     

  }
}).catch(function(err) {
  console.log(err.message);
});
  },

  handleAdopt: function(event) {
    event.preventDefault();

    var petId = parseInt($(event.target).data('id'));
    console.log('$(event.target).data(id) =', petId);
    //console.log('$(.panel-pet) =',  $('#myPetsRow').find('#panel-id'));
    //console.log('$(event.target).parentElement', $(event.target).parent());

    var ownerString =  $(event.target).parent().find('.owner').text();
    ownerstring_1 = ownerString.substring(0,8);
    ownerstring_2 = ownerString.substring(11,20);
    accountstring_1 = "0x"+web3.eth.defaultAccount.toString().toUpperCase().substring(2,8);
    accountstring_2 = web3.eth.defaultAccount.toString().toUpperCase().substring(34,42);
    //console.log('ownerstring_1 =',ownerstring_1);
    //console.log('ownerstring_2 =',ownerstring_2);
    //console.log('accountstring_1 =',accountstring_1);
    //console.log('accountstring_2 =',accountstring_2);
    if(ownerstring_1 == accountstring_1 && ownerstring_2 == accountstring_2){
      alert("You are the owner of this team, no need to buy!");
      return;   
    }

    var itemValueString =  $(event.target).parent().find('.Price').text();

    console.log("value selected item string =", itemValueString );

    var itemValue = parseFloat(itemValueString);    

    itemValue = web3.toWei(itemValue, 'ether');

    console.log("value selected item =", itemValue );    

    var adoptionInstance;

web3.eth.getAccounts(function(error, accounts) {
  if (error) {
    console.log(error);
  }

  var account = accounts[0];

  App.contracts.ItemToken.deployed().then(function(instance) {
    adoptionInstance = instance;

    // Execute adopt as a transaction by sending account
    return adoptionInstance.buy(petId, {from: account, gas: 95555, value: itemValue});
  }).then(function(result) {
    alert("Congratulations! You have bought a team now!");    
    return App.markAdopted(); 
  }).catch(function(err) {
    alert("Oops, we have an error here", error);
    console.log(err.message);
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
