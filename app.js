// modul odpowiedzialny za logike dzialania
var dataController = (function () {

    var Activity = function (id, description, calories) {
        this.id = id;
        this.description = description;
        this.calories = calories;
    };

    var Food = function (id, description, calories, carbohydrates, fats, proteins) {
        this.id = id;
        this.description = description;
        this.calories = calories;
        this.carbohydrates = carbohydrates;
        this.fats = fats;
        this.proteins = proteins;
    };

    var calculateTotal = function (type) {
        var totalCalories = 0;
        var totalCarbs = 0;
        var totalFats = 0;
        var totalProteins = 0;
        data.allItems[type].forEach(function (cur) {
            totalCalories += cur.calories;
            if (type === "food") {
                totalCarbs += cur.carbohydrates;
                totalFats += cur.fats;
                totalProteins += cur.proteins;
            }
        });
        data.totals[type] = totalCalories;
        if (type === "food") {
            data.carbohydrates = totalCarbs;
            data.fats = totalFats;
            data.proteins = totalProteins;
        }
    };

    var data = {
        bmiResult: -1,
        demand: 0,
        allItems: {
            food: [],
            activity: [],
        },
        totals: {
            food: 0,
            activity: 0,
        },
        carbohydrates: 0,
        demandCarbohydrates: 0,
        fats: 0,
        demandFats: 0,
        proteins: 0,
        demandProteins: 0,
        balance: 0,
    };

    return {

        calculateBmi: function (weight, height) {
            var bmi, bmiResult;
            // obliczanie bmi
            bmi = weight / Math.pow(height, 2);
            if (bmi > 0 && bmi < 18.5) bmiResult = 0; //"niedowaga";
            else if (bmi >= 18.5 && bmi <= 24.9) bmiResult = 1; //"waga prawidłowa";
            else if (bmi > 24.9 && bmi <= 29.9) bmiResult = 2; //"nadwaga";
            else if (bmi > 29.9) bmiResult = 3; //"otyłość";
            else bmiResult = -1;
            // dodanie wyniku do struktury
            data.bmiResult = bmiResult;
            return bmiResult;
        },

        calculateDemand: function (weight, height, sex, age, achievment) {
            // obliczanie bmr (podstawowego zapotrzebowania kalorycznego) metodą Mifflin-St Jeor. 
            // dla mężczyzn [9,99 x masa ciała (kg)] + [6,25 x wzrost (cm)] - [4,92 x wiek (lata)] + 5
            // dla kobiet [9,99 x masa ciała (kg)] + [6,25 x wzrost (cm)] - [4,92 x wiek(lata)] - 161
            var demand, bmr, pointer;
            var activityRate = 1.4; //wartość dla normalnego funkcjonowania

            // obliczanie zapotrzebowania kalorycznego
            if (sex === "man") pointer = 5;
            else if (sex === "woman") pointer = -161
            bmr = 9.99 * weight + 625 * height - 4.92 * age + pointer; //tyle kalorii spala przez dobę organizm w czasie spoczynku

            demand = bmr * activityRate;

            if (achievment === "gain-weight") demand += 400;
            else if (achievment === "keep-weight") demand;
            else if (achievment === "reduce-weight") demand -= 400;
            demand = parseInt(demand);
            data.demand = demand;

            return demand;
        },

        calculateCarbs: function (demand) {
            var carbs;
            carbs = 0.5 * demand / 4; //węglowodany powinny stanowić połowę dziennego zapotrzebowania kalorycznego, a jeden gram węglowodanów dostarcza 4 kcal
            carbs = parseInt(carbs);
            data.demandCarbohydrates = carbs;
            return carbs;
        },

        calculateFats: function (demand) {
            var fats;
            fats = 0.3 * demand / 9; //tłuszcze powinny stanowić 30% dziennego zapotrzebowania kalorycznego, a jeden gram tłuszczu dostarcza 9 kcal
            fats = parseInt(fats);
            data.demandFats = fats;
            return fats;
        },

        calculateProteins: function (weight) {
            var proteins;
            proteins = 0.9 * weight; //zapotrzebowanie na białko to 0.9 grama białka na każdy kilogram masy ciała
            proteins = parseInt(proteins);
            data.demandProteins = proteins;
            return proteins;
        },

        addItem: function (type, des, cal, car, fat, pro) {
            var newItem, ID;

            // tworzenie nowego ID
            if (data.allItems[type].length > 0) {
                ID = data.allItems[type][data.allItems[type].length - 1].id + 1;
            }
            else {
                ID = 0;
            }

            // nowy element zależny od typu
            if (type === 'activity') {
                newItem = new Activity(ID, des, cal);
            } else if (type === 'food') {
                newItem = new Food(ID, des, cal, car, fat, pro);
            }

            // dodanie elementu do struktury
            data.allItems[type].push(newItem);
            return newItem;
        },

        deleteItem: function (type, id) {
            var ids, index;
            ids = data.allItems[type].map(function (current) {
                return current.id;
            });
            index = ids.indexOf(id);
            if (index !== -1) {
                data.allItems[type].splice(index, 1);
            }
        },

        calculateData: function () {
            // obliczyć nabyte i spalone kalorie
            calculateTotal('food');
            calculateTotal('activity')
            // obliczyć składniki odżywcze

            // obliczyć bilans: demand - food + activity
            if (data.demand) {
                data.balance = data.demand - data.totals.food + data.totals.activity;
            }
            else {
                data.balance = data.totals.food - data.totals.activity;
            }
        },

        getData: function () {
            return {
                bmiResult: data.bmiResult,
                demand: data.demand,
                balance: data.balance,
                demandCarbohydrates: data.demandCarbohydrates,
                demandFats: data.demandFats,
                demandProteins: data.demandProteins,
                totalFood: data.totals.food,
                totalActivity: data.totals.activity,
                totalCarbs: data.carbohydrates,
                totalFats: data.fats,
                totalProteins: data.proteins
            };
        },

        testing: function () {
            console.log(data);
        }
    };

})();

// modul odpowiedzialny za pobieranie danych od uzytkownika i ich wysweitlanie
var UIController = (function () {

    var DOMstrings = {
        inputWeight: '.bmi-weight-input',
        inputHeight: '.bmi-height-input',
        bmiBtn: '.bmi-submit-button',
        outputBmi: '.bmi-result',
        inputSex: '.sex-selection',
        inputAge: '.age-input',
        inputAchievment: '.achievment-selection',
        demandBtn: '.demand-submit-button',
        inputType: '.add-type',
        inputDescription: '.add-description',
        inputCalories: '.add-calories-value',
        inputCarbohydrates: '.add-carbohydrates-value',
        inputProteins: '.add-proteins-value',
        inputFats: '.add-fats-value',
        inputBtn: '.add-button',
        inputType: '.add-type',
        foodContainer: '.food-list',
        activityContainer: '.activity-list',
        caloriesBalance: '.calories-balance',
        absorbedCalories: '.absorbed-calories-value',
        burnedCalories: '.burned-calories-value',
        outputCarbs: '.carbohydrates-value',
        outputFats: '.fats-value',
        outputProteins: '.proteins-value',
        displayContainer: '.display-list-container'
    };

    return {
        getBmiInput: function () {
            return {
                weight: parseFloat(document.querySelector(DOMstrings.inputWeight).value),
                height: parseFloat(document.querySelector(DOMstrings.inputHeight).value),
            }
        },

        getDemandInput: function () {
            return {
                sex: document.querySelector(DOMstrings.inputSex).value,
                age: parseInt(document.querySelector(DOMstrings.inputAge).value),
                achievment: document.querySelector(DOMstrings.inputAchievment).value,
            }
        },

        getinput: function () {
            return {
                type: document.querySelector(DOMstrings.inputType).value,
                description: document.querySelector(DOMstrings.inputDescription).value,
                calories: parseFloat(document.querySelector(DOMstrings.inputCalories).value),
                carbohydrates: parseFloat(document.querySelector(DOMstrings.inputCarbohydrates).value),
                fats: parseFloat(document.querySelector(DOMstrings.inputFats).value),
                proteins: parseFloat(document.querySelector(DOMstrings.inputProteins).value),
            }
        },

        displayBmi: function (result) {
            if (result === 0) {
                document.querySelector(DOMstrings.outputBmi).textContent = "Underweight";
            } else if (result === 1) {
                document.querySelector(DOMstrings.outputBmi).textContent = "Healthy weight";
            } else if (result === 2) {
                document.querySelector(DOMstrings.outputBmi).textContent = "Overweight";
            } else if (result === 3) {
                document.querySelector(DOMstrings.outputBmi).textContent = "Obesity";
            } else {
                document.querySelector(DOMstrings.outputBmi).textContent = "Insert your data to found if your weight is healthy";
            }
        },

        displayDemand: function (demand, carbs, fats, proteins) {
            document.querySelector(DOMstrings.caloriesBalance).textContent = demand;
            document.querySelector(DOMstrings.outputCarbs).textContent = "0/" + carbs + "g";
            document.querySelector(DOMstrings.outputFats).textContent = "0/" + fats + "g";
            document.querySelector(DOMstrings.outputProteins).textContent = "0/" + proteins + "g";
        },

        addListItem: function (obj, type) {
            var html, newHtml, element;
            // html string z placeholderem

            if (type === 'food') {
                element = DOMstrings.foodContainer;
                html = '<div class="item clearfix" id="food-%id%"> <div class="item-description">%description%</div> <div class="toRight"> <div class="item-calories">%calories%</div> <div class="item-delete"> <button class="item-delete-btn"> <i class="ion-ios-close-outline"></i> </button> </div> </div> </div>'
            }
            else if (type === 'activity') {
                element = DOMstrings.activityContainer;
                html = '<div class="item clearfix" id="activity-%id%"> <div class="item-description">%description%</div> <div class="toRight"> <div class="item-calories">%calories%</div> <div class="item-delete"> <button class="item-delete-btn"> <i class="ion-ios-close-outline"></i> </button> </div> </div> </div>'
            }

            // zastąpić placeholdera danymi użytkownika
            newHtml = html.replace('%id%', obj.id);
            newHtml = newHtml.replace('%description%', obj.description);
            newHtml = newHtml.replace('%calories%', obj.calories);

            // włożyć stworzony html do DOMu
            document.querySelector(element).insertAdjacentHTML('beforeend', newHtml);

        },

        deleteListItem: function (selectorID) {
            var el = document.getElementById(selectorID);
            el.parentNode.removeChild(el);
        },

        clearBmiFields: function () {
            var fields, fieldsArr;
            fields = document.querySelectorAll(DOMstrings.inputWeight + ', ' + DOMstrings.inputHeight);

            fieldsArr = Array.prototype.slice.call(fields);

            fieldsArr.forEach(function (current, index, array) {
                current.value = "";
            });

            fieldsArr[0].focus();
        },

        clearDemandFields: function () {
            var fields, fieldsArr;
            fields = document.querySelectorAll(DOMstrings.inputWeight + ', ' + DOMstrings.inputHeight + ', ' + DOMstrings.inputSex + ', ' + DOMstrings.inputAge + ', ' + DOMstrings.inputAchievment);

            fieldsArr = Array.prototype.slice.call(fields);

            fieldsArr.forEach(function (current, index, array) {
                current.value = "";
            });

            fieldsArr[0].focus();
        },

        clearFields: function () {
            var fields, fieldsArr;
            fields = document.querySelectorAll(DOMstrings.inputDescription + ', ' + DOMstrings.inputCalories + ', ' + DOMstrings.inputCarbohydrates + ', ' + DOMstrings.inputFats + ', ' + DOMstrings.inputProteins);

            fieldsArr = Array.prototype.slice.call(fields);

            fieldsArr.forEach(function (current, index, array) {
                current.value = "";
            });

            fieldsArr[0].focus();
        },

        displayData: function (obj) {
            document.querySelector(DOMstrings.caloriesBalance).textContent = obj.balance;
            document.querySelector(DOMstrings.absorbedCalories).textContent = obj.totalFood;
            document.querySelector(DOMstrings.burnedCalories).textContent = obj.totalActivity;
            if (obj.demandCarbohydrates > 0 && !isNaN(obj.demandCarbohydrates)) {
                document.querySelector(DOMstrings.outputCarbs).textContent = (Math.round(obj.totalCarbs * 100) / 100).toFixed(2) + "g/" + obj.demandCarbohydrates + "g";
            }
            else {
                document.querySelector(DOMstrings.outputCarbs).textContent = obj.totalCarbs + "g";
            }
            if (obj.demandFats > 0 && !isNaN(obj.demandFats)) {
                document.querySelector(DOMstrings.outputFats).textContent = (Math.round(obj.totalFats * 100) / 100).toFixed(2) + "g/" + obj.demandFats + "g";
            }
            else {
                document.querySelector(DOMstrings.outputFats).textContent = obj.totalFats + "g";
            }
            if (obj.demandProteins > 0 && !isNaN(obj.demandProteins)) {
                document.querySelector(DOMstrings.outputProteins).textContent = (Math.round(obj.totalProteins * 100) / 100).toFixed(2) + "g/" + obj.demandProteins + "g";
            }
            else {
                document.querySelector(DOMstrings.outputProteins).textContent = obj.totalProteins + "g";
            }
        },

        disabledFields: function () {
            var fields = document.querySelectorAll(DOMstrings.inputCarbohydrates + ',' + DOMstrings.inputProteins + ',' + DOMstrings.inputFats);

            for (var i = 0; i < fields.length; i++) {
                fields[i].disabled = !fields[i].disabled;
            }
        },

        getDOMstrings: function () {
            return DOMstrings;
        }
    }

})();

// glowny modul, bedacy lacznikiem miedzy dwoma pozostalymi modulami
var controller = (function (dataCtrl, UICtrl) {

    var setupEventListeners = function () {
        var DOM = UICtrl.getDOMstrings();

        document.querySelector(DOM.bmiBtn).addEventListener('click', ctrlCalculateBmi);

        document.querySelector(DOM.demandBtn).addEventListener('click', ctrlCalculateDemand);

        // document.querySelector(DOM.search).addEventListener('click', search);

        document.querySelector(DOM.inputBtn).addEventListener('click', ctrlAddItem);

        document.addEventListener('keypress', function (event) {
            if (event.keyCode === 13 || event.which === 13) {
                event.preventDefault(); //zapobiega wywołaniu przez enter kliknięcia
                ctrlAddItem();
            }
        });

        document.querySelector(DOM.displayContainer).addEventListener('click', ctrlDeleteItem);

        document.querySelector(DOM.inputType).addEventListener('change', UICtrl.disabledFields);
    };

    var ctrlCalculateBmi = function () {
        var bmiInput, bmiResult;
        // 1. pobrać dane z sekcji bmi
        bmiInput = UICtrl.getBmiInput();
        //1.1 wzrost w metrach
        if (bmiInput.height > 3) {
            alert("Enter height in metres")
        }
        else {
            // 2. obliczyć bmi
            bmiResult = dataCtrl.calculateBmi(bmiInput.weight, bmiInput.height);
            // 3. wyswietlić rezultat
            UICtrl.displayBmi(bmiResult);
            // UICtrl.clearBmiFields();
        }
    };

    var ctrlCalculateDemand = function () {
        var demandInput, bmiInput, demandResult, demandCarbs, demandFats, demandProteins;
        bmiInput = UICtrl.getBmiInput();
        demandInput = UICtrl.getDemandInput();
        if (bmiInput.weight !== "" && !isNaN(bmiInput.weight) && bmiInput.height !== "" && !isNaN(bmiInput.height) && demandInput.sex !== "" && demandInput.age !== "" && !isNaN(demandInput.age) && demandInput.achievment !== "") {
            demandResult = dataCtrl.calculateDemand(bmiInput.weight, bmiInput.height, demandInput.sex, demandInput.age, demandInput.achievment);
            // obliczanie zapotrzebowania na węglowodany
            demandCarbs = dataCtrl.calculateCarbs(demandResult);
            // obliczanie zapotrzebowania na tłuszcze
            demandFats = dataCtrl.calculateFats(demandResult);
            // obliczanie zapotrzebowania na białko
            demandProteins = dataCtrl.calculateProteins(bmiInput.weight);

            console.log(demandCarbs, demandFats, demandProteins);
            ctrlCalculateBmi();
            UICtrl.displayDemand(demandResult, demandCarbs, demandFats, demandProteins);
            // UICtrl.clearDemandFields();
        }
    };

    var updateData = function () {
        // 1. przelicz bilans kaloryczne
        dataCtrl.calculateData();
        // 2. zwróc bilans
        var balance = dataController.getData();
        // 3. wyswietl bilans
        UICtrl.displayData(balance);
    };

    var ctrlAddItem = function () {

        var input, newItem, json;

        // 1. zabierz dane z wypelnionych pól
        input = UICtrl.getinput();
        if (input.type === "activity" && input.description !== "" && !isNaN(input.calories) && input.calories > 0) {
            // 2. dodaj element do struktury danych
            newItem = dataCtrl.addItem(input.type, input.description, input.calories);
            // 3. dodaj element do UI
            UICtrl.addListItem(newItem, input.type);
            // wyczyść pole
            UICtrl.clearFields();

            // przelicz i zaktualizuj dane
            updateData();
        } else if (input.type === "food" && input.description !== "" && !isNaN(input.calories) && input.calories > 0 && !isNaN(input.carbohydrates) && input.carbohydrates > 0 && !isNaN(input.fats) && input.fats > 0 && !isNaN(input.proteins) && input.proteins > 0) {
            // 2. dodaj element do dataControllera
            newItem = dataCtrl.addItem(input.type, input.description, input.calories, input.carbohydrates, input.fats, input.proteins);
            // 3. dodaj element do UI
            UICtrl.addListItem(newItem, input.type);
            // wyczyść pole
            UICtrl.clearFields();

            // przelicz i zaktualizuj dane
            updateData();
        } else if (input.type === "food" && input.description !== "") {
            !async function(description){
                description = input.description;
                var url = "https://api.edamam.com/api/food-database/parser?app_key=5f170eb84b952c4fcea516af92f26774&app_id=0c94739e&ingr=";
                url += description;
                let data = await fetch(url)
                    .then((resp) => resp.json())
                    .then(data => {
                        return data;
                    })
                    .catch(error => {
                        console.error(error);
                    });
                var fetchedKalories = data.hints[0].food.nutrients.ENERC_KCAL;
                var fetchedProteins = data.hints[0].food.nutrients.PROCNT;
                var fetchedCarbs = data.hints[0].food.nutrients.CHOCDF;
                var fetchedFats = data.hints[0].food.nutrients.FAT;
                tempItem = dataCtrl.addItem(input.type, input.description, fetchedKalories, fetchedCarbs, fetchedFats, fetchedProteins);
                UICtrl.addListItem(tempItem, input.type);
                UICtrl.clearFields();
                updateData();
            }();
        }

    };


    var ctrlDeleteItem = function (event) {
        var itemID, splitID, type, ID;
        itemID = event.target.parentNode.parentNode.parentNode.parentNode.id;
        if (itemID) {
            splitID = itemID.split('-');
            type = splitID[0];
            ID = parseInt(splitID[1]);

            // 1.usunąć element ze struktury danych
            dataCtrl.deleteItem(type, ID);
            // 2. usunąć z UI
            UICtrl.deleteListItem(itemID);
            // 3. zaktualizować bilans i wyświetlić go
            updateData();

        }
    };

    return {
        init: function () {
            console.log("start");
            UICtrl.displayData({
                balance: 0,
                totalFood: 0,
                totalActivity: 0,
                totalCarbs: 0,
                totalFats: 0,
                totalProteins: 0
            });
            setupEventListeners();
        }
    }

})(dataController, UIController);

controller.init();