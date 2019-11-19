const Item = require('./models/item')

module.exports = {
    spawn: function(){
        for(let i = 0; i < 200; i++){
            var item = {
                name: 'item',
                category: 'category1',
                location: 'sample location',
                description: 'sample description',
                image: {
                    path: '\\items-pics\\Mother Board.png'
                },
                disposable: true,
                available: true,
                quantityAvailable: 100,
                statistics: {
                    visitsThisMonth: 25,
                    takenThisMonth: 7,
                    yearLog: {
                        visits: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
                        wasTaken: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
                    }
                }
            }

            item.name += i
            item.description += i
            Item.create(item, function(err, item){
                if(err){
                    console.log(err)
                } else {
                    console.log(item.name + " was created!")
                }
            })
        }
    }
}