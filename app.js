require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const date = require(__dirname + "/date.js");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://"+process.env.Admin+":"+process.env.Password+"@cluster0.wqcnvwr.mongodb.net/todolistDB");

const itemsSchema = {
    name: String
};

const Item = mongoose.model("Item", itemsSchema);

const items = ["Buy Food", "Cook Food", "Eat Food"];

const item1 = new Item({name: "Welcome to your todolist!"});

const item2 = new Item({name: "Hit the + button to add a new item."});

const item3 = new Item({name: "<-- Hit this to delete an item."})

const defaultItems = [item1, item2, item3];

const listSchema = {
    name: String,
    items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

async function getItems() {

    const Items = await Item.find({});
    return Items;

}

app.get("/", function (req, res) {

    // const day = date.getDate();
    getItems().then(function (foundItems) {
        if (foundItems.length === 0) {
            Item
                .insertMany(defaultItems)
                .then(function () {
                    console.log("Successfully saved defult items to DB");
                })
                .catch(function (err) {
                    console.log(err);
                });
            res.redirect("/");
        } else {
            res.render("list", {
                listTitle: "Today",
                newListItems: foundItems
            });
        }
    })

});

app.post("/", function (req, res) {

    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({name: itemName});

    if (listName === "Today") {
        item.save();
        res.redirect("/");
    } else {
        List.findOne({name: listName})
            .then(function (foundList) {
                foundList.items.push(item);
                foundList.save();
                res.redirect("/" + listName);
            })
            .catch(function (err) {
                console.log(err);
            });
    }
});

app.post("/delete", function (req, res) {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === "Today"){
    Item.findByIdAndRemove(checkedItemId)
        .then(function () {
            console.log("Successfully deleted checked item.");
            res.redirect("/");
        })
        .catch(function (err) {
            console.log(err);
        });
      }else{
        List.findOneAndUpdate({name:listName},{$pull:{items:{_id:checkedItemId}}})
        .then(function () {
            console.log("Successfully deleted checked item.");
            res.redirect("/"+listName);
        })
        .catch(function (err) {
            console.log(err);
        });
      }
});

app.get("/:customListName", function (req, res) {

    const customListName = _.capitalize(req.params.customListName);

    List
        .findOne({name: customListName})
        .then(function (foundList) {
            if (!foundList) {
                const list = new List({name: customListName, items: defaultItems});
                list.save();
                res.redirect("/" + customListName);
            } else {
                res.render("list", {
                    listTitle: foundList.name,
                    newListItems: foundList.items
                });
            }
        })
        .catch(function (err) {
            console.log(err);
        });
    
});


app.post('/create', (req, res) => {
    const inputValue = req.body.create;
    res.redirect("/" + inputValue);
  });

app.listen(process.env.PORT || 3000, function () {
    console.log("Server started successfully.");
});
