/*
  Copyright 2020, 2021 David Healey

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

import * as Utils from "/www/assets/js/utils.js";
import * as Group from "./group.js";
import * as Editor from "/www/src/activities/foods-meals-recipes/js/food-editor.js";

var s;
waistline.Diary = {

  settings: {
    ready: false,
    calendar: undefined,
    el: {}
  },

  init: async function(context) {
    s = this.settings; //Assign settings object

    this.getComponents();
    this.bindUIActions();

    //If items have been passed, add them to the db
    if (context) {

      if (context.items || context.item) {

        if (context.items)
          await this.addItems(context.items, context.category);
        else
          await this.updateItem(context.item);

        s.ready = false; //Trigger fresh render
      }
    }

    s.calendar = this.createCalendar(); //Setup calendar
    this.bindCalendarControls();

    if (!s.ready) {
      s.groups = this.createMealGroups(); //Create meal groups
      this.render();
      s.ready = true;
    }
  },

  getComponents: function() {
    s.el.logWeight = document.querySelector(".page[data-name='diary'] #log-weight");
  },

  bindUIActions: function() {

    // logWeight
    if (!s.el.logWeight.hasClickEvent) {
      s.el.logWeight.addEventListener("click", (e) => {
        waistline.Diary.logWeight();
      });
      s.el.logWeight.hasClickEvent = true;
    }

  },

  setReadyState: function(state) {
    if (state) {
      s.ready = state;
    }
  },

  createCalendar: function() {

    //Setup calendar object
    let result = f7.calendar.create({
      inputEl: "#diary-date",
      openIn: "customModal",
      on: {
        init: function(c) {
          if (s.date)
            c.setValue([s.date]);
          else {
            let now = new Date();
            let today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            c.setValue([today]);
            s.date = c.getValue();
          }
        },
        change: function(c) {
          s.date = c.getValue();
          if (s.ready)
            waistline.Diary.render();
          c.close();
        }
      }
    });

    return result;
  },

  bindCalendarControls: function() {
    //Bind actions for previous/next buttons
    const buttons = document.getElementsByClassName("change-date");
    Array.from(buttons).forEach((x, i) => {

      if (!x.hasClickEvent) {
        x.addEventListener("click", (e) => {
          let date = new Date(s.calendar.getValue());
          i == 0 ? date.setDate(date.getDate() - 1) : date.setDate(date.getDate() + 1);
          s.calendar.setValue([date]);
        });
        x.hasClickEvent = true;
      }
    });
  },

  resetDate: function() {
    let now = new Date();
    let today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    s.date = today;
  },

  render: async function() {

    let entry = await this.getEntryFromDB(); // Get diary entry from DB
    let totalNutrition;

    //Clear groups
    for (let i = 0; i < s.groups.length; i++)
      s.groups[i].reset();

    // Populate groups and get overal nutrition
    if (entry) {
      await this.populateGroups(entry);
      totalNutrition = await waistline.FoodsMealsRecipes.getTotalNutrition(entry.foods);
    }

    // Render category groups
    let container = document.getElementById("diary-day");
    container.innerHTML = "";

    s.groups.forEach((x) => {
      x.render(container);
    });

    // Render nutrition swiper card
    let swiper = f7.swiper.get('#diary-nutrition .swiper-container');
    let swiperWrapper = document.querySelector('#diary-nutrition .swiper-wrapper');
    swiperWrapper.innerHTML = "";

    await waistline.FoodsMealsRecipes.renderNutritionCard(totalNutrition, new Date(s.date), swiper);
  },

  createMealGroups: function() {
    const mealNames = waistline.Settings.get("diary", "meal-names");
    let groups = [];

    mealNames.forEach((x, i) => {
      if (x != "") {
        let g = Group.create(x, i);
        groups.push(g);
      }
    });

    return groups;
  },

  getEntryFromDB: function() {
    return new Promise(function(resolve, reject) {
      if (s.date !== undefined) {

        let from = new Date(s.date);
        let to = new Date(from);
        to.setUTCHours(to.getUTCHours() + 24);

        let result;

        dbHandler.getIndex("dateTime", "diary").openCursor(IDBKeyRange.bound(from, to, false, true)).onsuccess = function(e) {
          let cursor = e.target.result;
          if (cursor) {
            result = cursor.value;
            cursor.continue();
          } else {
            resolve(result);
          }
        };
      }
    }).catch(err => {
      throw (err);
    });
  },

  populateGroups: function(entry) {
    return new Promise(async function(resolve, reject) {

      // Get details and nutritional data for each food
      for (let i = 0; i < entry.foods.length; i++) {
        let x = entry.foods[i];
        let details = await waistline.FoodsMealsRecipes.getFood(x.id);

        x.name = details.name;
        x.brand = details.brand;
        x.recipe = details.recipe || false;
        x.nutrition = await waistline.FoodsMealsRecipes.getNutrition(x);
        x.index = i;

        s.groups[x.category].addItem(x);
      }

      resolve();
    }).catch(err => {
      throw (err);
    });
  },

  addItems: function(items, category) {
    return new Promise(async function(resolve, reject) {

      // Get current entry or create a new one
      let entry = await waistline.Diary.getEntryFromDB() || waistline.Diary.getNewEntry();

      items.forEach((x) => {
        let item = {
          id: x.id,
          portion: x.portion,
          quantity: x.quantity || 1,
          category: category
        };
        entry.foods.push(item);
      });

      await dbHandler.put(entry, "diary");

      resolve();
    }).catch(err => {
      throw (err);
    });
  },

  updateItem: function(data) {
    return new Promise(async function(resolve, reject) {

      let entry = await waistline.Diary.getEntryFromDB();

      if (entry) {
        let item = {
          id: data.id,
          category: data.category,
          portion: data.portion,
          quantity: data.quantity || 1,
        };

        entry.foods.splice(data.index, 1, item);

        dbHandler.put(entry, "diary").onsuccess = function() {
          resolve();
        };
      } else {
        resolve();
      }
    }).catch(err => {
      throw (err);
    });
  },

  deleteItem: function(item) {
    let title = waistline.strings["confirm-delete-title"] || "Delete";
    let text = waistline.strings["confirm-delete"] || "Are you sure?";

    let dialog = f7.dialog.confirm(text, title, async () => {

      let entry = await waistline.Diary.getEntryFromDB();

      if (entry !== undefined)
        entry.foods.splice(item.index, 1);

      dbHandler.put(entry, "diary").onsuccess = function(e) {
        f7.views.main.router.refreshPage();
      };
    });
  },

  logWeight: function() {
    let title = waistline.strings["record-weight"] || "Record Weight";
    let text = waistline.strings["weight"] || "Weight";
    let lastWeight = window.localStorage.getItem("weight") || 0;

    let dialog = f7.dialog.prompt(text, title, this.setWeight, null, lastWeight);
  },

  setWeight: async function(value) {

    let entry = await waistline.Diary.getEntryFromDB() || waistline.Diary.getNewEntry();

    entry.stats.weight = {
      value: value,
      unit: "kg"
    };

    dbHandler.put(entry, "diary").onsuccess = function(e) {
      window.localStorage.setItem("weight", value);
      Utils.toast("Saved");
    };
  },

  getNewEntry: function() {
    let entry = {
      dateTime: new Date(s.date),
      foods: [],
      stats: {},
    };
    return entry;
  },

  gotoFoodlist: function(category) {
    f7.views.main.router.navigate("/foods-meals-recipes/", {
      "context": {
        origin: "/diary/",
        category: category,
        date: new Date(s.calendar.getValue())
      }
    });
  },

  /* Sum the nutrition values for all groups */
  getNutritionTotals: function() {
    let result = {};
    s.groups.forEach((x, i) => {
      for (let k in x.nutrition) {
        result[k] = result[k] || 0;
        result[k] += x.nutrition[k];
      }
    });
    return result;
  },
};

document.addEventListener("page:init", function(event) {
  if (event.target.matches(".page[data-name='diary']")) {
    //let context = f7.views.main.router.currentRoute.context;
    let context = f7.data.context;
    f7.data.context = undefined;
    waistline.Diary.init(context);
  }
});

document.addEventListener("page:reinit", function(event) {
  if (event.target.matches(".page[data-name='diary']")) {
    //let context = f7.views.main.router.currentRoute.context;
    let context = f7.data.context;
    f7.data.context = undefined;
    waistline.Diary.init(context);
  }
});