var mysql=require('mysql');
var connection=mysql.createPool({

// host:'send.emddi.com',
// user:'usersend',
// password:'secret@usersend#',
// database:'maindb'

host:'db.emddi.com',
user:'usersend',
password:'secret@2011ABC#',
database:'maindb'
 
});
module.exports=connection;