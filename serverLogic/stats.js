const Item = require("../models/item");

const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

module.exports = {

    // updates the statistics about each item
    // should be scheduled for the 1st of each month
    updateStats: function(){
        Item.find({}, function(err, items){
            if(err){
                console.log(err);
            } else {
                if(items.length == 0){
                    console.log("Could not find any items to update statistics!");
                } else {
                    let date = new Date();

                    items.forEach(function(item){

                        item.statistics.yearLog.visits[date.getMonth()-1] = item.statistics.visitsThisMonth;
                        item.statistics.yearLog.wasTaken[date.getMonth()-1] = item.statistics.takenThisMonth;
                        item.markModified('statistics');
                        item.statistics.visitsThisMonth = 0;
                        item.statistics.takenThisMonth = 0;
                        item.save();

                        console.log("stats updated for item: " + item.name + ", at: " + date.getHours() + ":" + date.getMinutes());
                    })
                }
            }
        })
    }
}