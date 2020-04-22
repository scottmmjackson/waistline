/*
  Copyright 2018, 2019, 2020 David Healey

  This file is part of Waistline.

  Waistline is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  Waistline is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with Waistline.  If not, see <http://www.gnu.org/licenses/>.
*/

/*var app = {

  mode: "development",
  tests:{}, //Object to hold test functions to be run by TinyTest
  strings: {},
  standardUnits: ["ug", "μg", "mg", "g", "kg", "ul", "μl", "ml", "dl", "dL", "cl", "cL", "l", "L"],
  nutriments: ["calories", "proteins", "carbohydrates","fat", "saturated-fat", "monounsaturated-fat", "polyunsaturated-fat", "trans-fat", "omega-3-fat", "cholesterol", "sugars", "fiber", "sodium", "salt", "potassium","vitamin-a", "vitamin-d", "vitamin-e", "vitamin-k", "vitamin-c", "vitamin-b1", "vitamin-b2", "vitamin-b6", "vitamin-b9", "vitamin-b12", "chloride", "calcium", "iron", "magnesium", "zinc", "caffeine", "alcohol", "sucrose", "glucose", "fructose", "lactose"],
  nutrimentUnits: {
    "calories":"kcal",
    "cholesterol":"mg",
    "sodium":"mg",
    "potassium":"mg",
    "calcium":"mg",
    "iron":"mg",
    "magnesium":"mg",
    "zinc":"mg",
    "caffeine":"g",
    "alcohol":"%",
    "vitamin-a":"µg",
    "vitamin-d":"µg",
    "vitamin-e":"mg",
    "vitamin-k":"µg",
    "vitamin-c":"mg",
    "vitamin-b1":"mg",
    "vitamin-b2":"mg",
    "vitamin-b6":"g",
    "vitamin-b9":"µg",
    "vitamin-b12":"µg"
  },

  // Application Constructor
  initialize: function() {

    //Set some default settings
    if (window.localStorage.getItem("goals") == undefined) goals.setDefaultGoals(); //Goals
    if (window.localStorage.getItem("weight") == undefined) window.localStorage.setItem("weight", 70); //Weight
    if (window.localStorage.getItem("meal-names") == undefined) window.localStorage.setItem("meal-names", JSON.stringify(["Breakfast", "Lunch", "Dinner", "Snacks"])); //Meal names

  return new Promise(function(resolve, reject){
      dbHandler.initializeDb() //db-handler initialization
      .then(function() {
        //Add appInitialized event
        let event = new CustomEvent("appInitialized");
        window.dispatchEvent(event);
        resolve();
      });
    });
  },

  validateInputs: function(inputs) {

    let messages = [];

    for (let i = 0; i < inputs.length; i++) {
      let input = inputs[i];
      if (input.hasAttribute("required")) {
        if (input.value == null || input.value == ""){
          messages.push(input.getAttribute("name"));
        }
      }
    }

    if (messages.length > 0) return messages;
    return true;
  },

  setTheme: function(theme) {
    let e = document.querySelector('#theme-css');
    switch(theme) {
      case "0": e.setAttribute("href", "assets/onsen/css/light-onsen-css-components.min.css"); break;
      case "1": e.setAttribute("href", "assets/onsen/css/dark-onsen-css-components.min.css"); break;
    }
  },

  // Function to sort ascending an array of objects by some specific key.
  dynamicSort: function(property, type) {

    if (type == "date")
      return function (a,b) {return new Date(b[property]).getTime() - new Date(a[property]).getTime();};
    else
      return function (a,b) {return a[property].localeCompare(b[property]);};
  },
};

ons.ready(function() {
  app.initialize()
  .then(function(){
    console.log("App Initialized");

    let colourScheme = settings.get("theme", "colour-scheme");
    app.setTheme(colourScheme);

    let homescreen = settings.get("theme", "homescreen") || "diary";

    nav.resetToPage("src/activities/" + homescreen + "/views/" + homescreen + ".html")
    .then(function(){
      if (app.mode == "development") {
        TinyTest.run(app.tests); //Run tests
      }
    });
  });
});
*/

var app = new Framework7({
  // App root element
  root: "#app",
  // App Name
  name: "Waistline",
  // App id
  id: "com.waist.line",
  version: "2.5",
    // Enable swipe panel
  panel: {
    swipe: "left",
  },
    calendar: {
    url: 'calendar/',
    dateFormat: 'dd.mm.yyyy',
  },
  // Add default routes
  routes: [
    {
      name: "Statistics",
      path: "/statistics/",
      url: "/www/src/activities/statistics/views/statistics.html"
    },
    {
      name: "Diary",
      path: "/diary/",
      url: "/www/src/activities/diary/views/diary.html"
    },
    {
      name: "Foods, Meals, Recipes",
      path: "/foods-meals-recipes/",
      url: "/www/src/activities/foods-meals-recipes/views/foods-meals-recipes.html"
    },
    {
      name: "Goals",
      path: "/goals/",
      url: "/www/src/activities/goals/views/goals.html"
    },
    {
      name: "About",
      path: "/about/",
      url: "about.html"
    },
  ]
});

var mainView = app.views.create(".view-main");

document.addEventListener("page:init", function(event){

  //Close panel when switching pages
  var panelLeft = app.panel.get('.panel-left');
  if (panelLeft)
    panelLeft.close(true);
  
});

app.on("init", function(event){
  app.views.main.router.navigate("/diary/");
  
  return new Promise(function(resolve, reject){
      dbHandler.initializeDb() //db-handler initialization
      .then(function() {
        //Add appInitialized event
        let event = new CustomEvent("appInitialized");
        window.dispatchEvent(event);
        resolve();
      });
    });
  };
  
  
});