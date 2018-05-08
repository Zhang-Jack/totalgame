App = {
  web3Provider: null,
  contracts: {},
  sortMethod: 0,

  init: function() {
    // Load pets.
    $.getJSON('../pets.json', function(data) {
      var petsRow = $('#petsRow');
      var petTemplate = $('#petTemplate');

      for (i = 0; i < data.length; i ++) {
        petTemplate.find('.panel-title').text(data[i].name);
        petTemplate.find('img').attr('src', data[i].picture);
        petTemplate.find('.Price').text(data[i].Price);
        petTemplate.find('.Group').text(data[i].Group);
        petTemplate.find('.btn-adopt').attr('data-id', data[i].id);
        petTemplate.find('.panel-pet').attr('panel-id', data[i].id);
        petsRow.append(petTemplate.html());
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
  return App.markAdopted();
});
    return App.bindEvents();
  },

  bindEvents: function() {
    $(document).on('click', '.btn-adopt', App.handleAdopt);
    $(document).on('click', '.PriceAscending', App.PriceAscending);    
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

showAllTeams:function(){
      $('li').removeClass('active');
    $('.market-tab').addClass('active');    
    $('.all-tab').addClass('active');
    $.getJSON('../pets.json', function(data) {
      var petsRow = $('#petsRow');
      var petTemplate = $('#petTemplate');
      petsRow.html("");    
      for (i = 0; i < data.length; i ++) {
        petTemplate.find('.panel-title').text(data[i].name);
        petTemplate.find('img').attr('src', data[i].picture);
        petTemplate.find('.Price').text(data[i].Price);
        petTemplate.find('.Group').text(data[i].Group);
        petTemplate.find('.btn-adopt').attr('data-id', data[i].id);
        petTemplate.find('.panel-pet').attr('panel-id', data[i].id);
        petsRow.append(petTemplate.html());
      }
    });
    return App.markAdopted();    
},

showFIFATeams:function(){
      $('li').removeClass('active');
    $('.market-tab').addClass('active');    
    $('.fifa-tab').addClass('active');
    $.getJSON('../pets.json', function(data) {
      var petsRow = $('#petsRow');
      var petTemplate = $('#petTemplate');
      petsRow.html("");    
      for (i = 0; i < 32; i ++) {
        petTemplate.find('.panel-title').text(data[i].name);
        petTemplate.find('img').attr('src', data[i].picture);
        petTemplate.find('.Price').text(data[i].Price);
        petTemplate.find('.Group').text(data[i].Group);
        petTemplate.find('.btn-adopt').attr('data-id', data[i].id);
        petTemplate.find('.panel-pet').attr('panel-id', data[i].id);
        petsRow.append(petTemplate.html());
      }
    });
    return App.markAdopted();    
},

showPLTeams:function(){
      $('li').removeClass('active');
    $('.market-tab').addClass('active');    
    $('.pl-tab').addClass('active');
    $.getJSON('../pets.json', function(data) {
      var petsRow = $('#petsRow');
      var petTemplate = $('#petTemplate');
      petsRow.html("");    
      for (i = 32; i < 52; i ++) {
        petTemplate.find('.panel-title').text(data[i].name);
        petTemplate.find('img').attr('src', data[i].picture);
        petTemplate.find('.Price').text(data[i].Price);
        petTemplate.find('.Group').text(data[i].Group);
        petTemplate.find('.btn-adopt').attr('data-id', data[i].id);
        petTemplate.find('.panel-pet').attr('panel-id', data[i].id);
        petsRow.append(petTemplate.html());
      }
    });
    return App.markAdopted();    
},

showLLTeams:function(){
      $('li').removeClass('active');
    $('.market-tab').addClass('active');    
    $('.ll-tab').addClass('active');
    $.getJSON('../pets.json', function(data) {
      var petsRow = $('#petsRow');
      var petTemplate = $('#petTemplate');
      petsRow.html("");    
      for (i = 52; i < 72; i ++) {
        petTemplate.find('.panel-title').text(data[i].name);
        petTemplate.find('img').attr('src', data[i].picture);
        petTemplate.find('.Price').text(data[i].Price);
        petTemplate.find('.Group').text(data[i].Group);
        petTemplate.find('.btn-adopt').attr('data-id', data[i].id);
        petTemplate.find('.panel-pet').attr('panel-id', data[i].id);
        petsRow.append(petTemplate.html());
      }
    });
    return App.markAdopted();    
},

showLSATeams:function(){
      $('li').removeClass('active');
    $('.market-tab').addClass('active');    
    $('.lsa-tab').addClass('active');
    $.getJSON('../pets.json', function(data) {
      var petsRow = $('#petsRow');
      var petTemplate = $('#petTemplate');
      petsRow.html("");    
      for (i = 72; i < 92; i ++) {
        petTemplate.find('.panel-title').text(data[i].name);
        petTemplate.find('img').attr('src', data[i].picture);
        petTemplate.find('.Price').text(data[i].Price);
        petTemplate.find('.Group').text(data[i].Group);
        petTemplate.find('.btn-adopt').attr('data-id', data[i].id);
        petTemplate.find('.panel-pet').attr('panel-id', data[i].id);
        petsRow.append(petTemplate.html());
      }
    });
    return App.markAdopted();    
},

showFBTeams:function(){
      $('li').removeClass('active');
    $('.market-tab').addClass('active');    
    $('.fb-tab').addClass('active');
    $.getJSON('../pets.json', function(data) {
      var petsRow = $('#petsRow');
      var petTemplate = $('#petTemplate');
      petsRow.html("");    
      for (i = 92; i < 110; i ++) {
        petTemplate.find('.panel-title').text(data[i].name);
        petTemplate.find('img').attr('src', data[i].picture);
        petTemplate.find('.Price').text(data[i].Price);
        petTemplate.find('.Group').text(data[i].Group);
        petTemplate.find('.btn-adopt').attr('data-id', data[i].id);
        petTemplate.find('.panel-pet').attr('panel-id', data[i].id);
        petsRow.append(petTemplate.html());
      }
    });
    return App.markAdopted();
},

showL1Teams:function(){
    $('li').removeClass('active');
    $('.market-tab').addClass('active');    
    $('.l1-tab').addClass('active');
    $.getJSON('../pets.json', function(data) {
      var petsRow = $('#petsRow');
      var petTemplate = $('#petTemplate');
      petsRow.html("");    
      for (i = 110; i < 130; i ++) {
        petTemplate.find('.panel-title').text(data[i].name);
        petTemplate.find('img').attr('src', data[i].picture);
        petTemplate.find('.Price').text(data[i].Price);
        petTemplate.find('.Group').text(data[i].Group);
        petTemplate.find('.btn-adopt').attr('data-id', data[i].id);
        petTemplate.find('.panel-pet').attr('panel-id', data[i].id);
        petsRow.append(petTemplate.html());
      }
    });
    return App.markAdopted();
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
      //var display_owner = Promise[1].toString().substring(2,8)+"..."+Promise[1].toString().substring(34,42);
      var display_owner = Promise[1].toString().substring(2,42);
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
      }else
         console.log('sortMethod =',App.sortMethod);
      
      
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
    //console.log('$(.panel-pet) =',  $('#petsRow').find('#panel-id'));
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
