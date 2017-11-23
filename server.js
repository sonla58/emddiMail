var express = require('express');
var app = express();
var bodyparser = require('body-parser');
app.set('view engine', 'ejs');
app.set('views', './views');
var server = require("http").createServer(app);
var hbs = require('nodemailer-express-handlebars');
var db = require('./database');
server.listen(process.env.PORT || 3000, function(){
	console.log('Server listening on port ' + server.address().port);
    //thinhav: dung de hen thoi gian, cu 5 phut lai quet database 1 lan
    setInterval(function(){
    checkScanDatabase();
        }, 1000);
});
app.use(bodyparser.urlencoded({extended: true}));
app.use(bodyparser.json());

var nodemailer =  require('nodemailer');

var mCheckDatabase = false; // thinhav: kiem tra xem bang template_mail co noi dung ko? false = KO GUI
var mEmail, mId;
var mExpense, mBookTime, mBookId, mCurrency, mCusomerName, mDiscount, mDriver, mFinishPoint, mPayment, mStartPoint, mTotalPrice, mTotalReal;
var mailOptions;

var transporter =  nodemailer.createTransport({ // config mail server
    host: 'email-smtp.us-east-1.amazonaws.com',
    port: 465,
    secure: true,
    auth: {
        // thinhav: day la email minh dung de gui cho khach hang
        user: 'AKIAIOMEGYNPDKGX4X4Q',
        pass: 'Ahx+2aO4v69+jVCNEJb5P8T1JSGkcswDVKsSoH56FIWp'
    }
});

transporter.use('compile', hbs({
        viewPath:'views',
        extName:'.ejs'
}));

// thinhav: kiem tra xem co dang gui email ko hay dang o trang thai nghi
function checkScanDatabase(){
    if (mCheckDatabase == false){
        mCheckDatabase = true;
        scanTemplateEmail();
        console.log("Khoi dong quet databse");
    } else{
        console.log("dang gui mail");
    }
}

// thinhav: ham quet du lieu trong bang tam mail de gui
// sau khi gui mail thi xoa dong vua gui di
function scanTemplateEmail(){
    var sqlSelect =  "SELECT * FROM send_email LIMIT 1";
    db.query(sqlSelect,  function(err, result){
        if (err) {
            throw err;
        } else {
            if(result[0] != null){
                mEmail = result[0].email;
                var body = result[0].body;
                let typeMail = result[0].type;
                    if(typeMail == 10 && body != null){
                        setBodyMailFinish(JSON.parse(body));
                        mailOptions = { // thiết lập đối tượng, nội dung gửi mail
                            from: '"Emddi" <no-reply@emddi.com>', 
                            to: mEmail,
                            subject: 'Your Emddi E-Receipt',
                            template: 'mail_finish', // noi dung html cua mail
                            context:{ // truyen thong tin sang form html
                                mExpense, // chi phi
                                mBookTime, // thoi gian dat ve
                                mCurrency, // loai tien thanh toan
                                mBookId, // ma dat xe
                                mCusomerName, // ten KH
                                mDiscount, // cuoc phi
                                mDriver, // ten lai xe
                                mStartPoint, // diem di
                                mFinishPoint, // diem xuong
                                mPayment,  // phuong thuc thanh toan
                                mTotalPrice, // tong tien KH phai tra
                                mTotalReal, // tong tien dua
                            }
                        }
                    } else if(typeMail == 1){
                        setBodyMailWelcome(JSON.parse(body));
                        mailOptions = {
                            from: '"Emddi" <no-reply@emddi.com>', 
                            to: mEmail,
                            subject: 'Hello from Emddi',
                            template: 'welcome', // noi dung html cua mail
                            context:{ // truyen thong tin sang form html
                            }
                        }
                    }
                    console.log("mEmail = " + mEmail);
                    //thinhav:  gui mail den client, neu thanh cong thi xoa ban ghi vua select di
                    transporter.sendMail(mailOptions, function(err, info){
                        if (err) {
                            console.log(err);    
                            insertEmailTemp(result[0].email, result[0].body);
                            deleteRowDatabase(result[0]);                       
                        } else {
                            console.log('Message sent: ' +  info.response);
                            deleteRowDatabase(result[0]);
                        }
                    });
            } else{
               mCheckDatabase = false; 
            }         
        }
    });
}

function setBodyMailFinish(body){
    mExpense = body.add_expense;   
    mBookTime = body.book_time;
    mCurrency = body.currency;
    mCusomerName = body.customer_name;
    mDiscount = body.discount;
    mDriver = body.driver_name;
    mStartPoint = body.start_address;
    mFinishPoint = body.end_address;
    mPayment = body.payment_method;
    mTotalPrice = body.total_price;
    mTotalReal = body.total_real;
    mBookId = body.booking_id;
}

function setBodyMailWelcome(body){
    
}

// thinhav: ham xoa 1 dong trong database
function deleteRowDatabase(result){
    var sqlDelete = "DELETE FROM send_email WHERE id =?";
        var id =  result.id;
        console.log("delete id mail = " + id);
        db.query(sqlDelete, [id], function(err, result){
            if (err) {
                 throw err;
            } else{
                mExpense = "";   
                mBookTime = "";
                mCurrency = "";
                mCusomerName = "";
                mDiscount = "";
                mDriver = "";
                mStartPoint = "";
                mFinishPoint = "";
                mPayment = "";
                mTotalPrice = "";
                mTotalReal = "";
                mBookId = "";
            }
        });
    scanTemplateEmail();
}

function insertEmailTemp(emails, bodys){
    console.log("thinhav: " + emails + bodys);
    var sql = "INSERT INTO maindb.email_temp(email, body) VALUES (?, ?);";
    db.query(sql, [emails, bodys], function(err, result){
        if(err){        
            console.log("thinhav: insert loi , " + err);
        }else{
            console.log("thinhav: insert thanh cong");
        }
    });
}