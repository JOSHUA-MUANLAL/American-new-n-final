const router = require("express").Router();

const path=require('path');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const viewsPath = path.join(__dirname);
const bcrypt = require('bcrypt');
const db = require('../model/db');
const authMiddleware=require('../middleware/authenticate')
const secret_key="joshua"

router.get("/",(req,res)=>{

   // db.query('Create table if not exists usertable(')
   res.render('home')
})

router.get('/login',(req,res)=>{
    res.render('login',{})
})

router.get('/register',(req,res)=>{
    res.render('register',{})
})

router.post('/register',async(req,res)=>{
    try{
        const email=req.body.email;
        const name=req.body.name;
        const password=req.body.password;
        const amount=req.body.amount;
        const phone=req.body.phone;

        db.query("select email from usertable where email=?",[email],async(err,result)=>{
            if(err){
                console.log("error in checking mail",err)
                return err;
            }else{
                if(result.length===0){
                    const saltRounds=10;
                    const hashedPassword=await bcrypt.hash(password, saltRounds)
                    
                    db.query("insert into usertable(name,email,phone,password,amount) values(?,?,?,?,?)",[name,email,phone,hashedPassword,amount],(err,result)=>{
                        if(err){console.log(err,"error in inserting")
                            console.log(err,"error in registration");
                        }else{
                            console.log("here")
                            let tablename=email+hashedPassword.substring(0,10).toLowerCase();

                            db.query(`create table \`${tablename}\`(transaction_id INT PRIMARY KEY AUTO_INCREMENT, date DATE, income INT DEFAULT 0, expense INT DEFAULT 0, total_amount INT)`,(err,result)=>{
                                if(err){
                                    console.log(err,"error in creating table")
                                }else{
                                    var today = new Date();
                                    var year = today.getFullYear();
                                    var month = today.getMonth() + 1; 
                                    var day = today.getDate();
        
                                    var formattedDate = year + '-' + (month < 10 ? '0' : '') + month + '-' + (day < 10 ? '0' : '') + day;
        
                                    console.log(formattedDate);
                                    
                                    db.query(`insert into \`${tablename}\` (date,total_amount) values (?,?)`,[formattedDate,amount],(err,result)=>{
                                        if(err){
                                            console.log("erro in signup insert table",err)
                                           
                                        }else{
                                            console.log('register done')
                                            let msg="Registration done"
                                            res.render('login',{})
                                        }
                                    })
        
                                }
                            })
                        }
                    })
        
                }else{
                    let msg="User already existed";
                    res.render('register',{msg})
                }

            }
        });
        





    }catch(error){
        console.log("error caught in register",error)
    }
})


router.post('/login',async(req,res)=>{
    const email=req.body.email;
    const password=req.body.password;
    

    
    try{
        db.query(`select* from usertable where email=?`,[email],async(err,result)=>{
            if(err){
                console.log("login")
            }else{
                if(result.length===0){
                    let msg="no such user exist";
                    res.render('login',{msg})
                }else{
                    const match = await bcrypt.compare(password, result[0].password);
                    if(match){
                        const tablename=email+result[0].password.substring(0,10).toLowerCase();
                        console.log(tablename)
                        let userdetail={ email: result[0].email, password: result[0].password,name:result[0].name,number:result[0].phone, amount:result[0].amount ,tablename:tablename}
                        const token = jwt.sign(userdetail, secret_key);
                       
                        db.query(`select * from \`${tablename}\``,(err,result)=>{
                            if(err){
                                console.log("unable to get user balance ",err)
                            }else{
                                let balance=result;
                                console.log("success")
                                
                                res.cookie('jwt', token, { httpOnly: true });
                                res.render('userpage',{userdetail,balance})
                                //res.redirect(`/userpage?balance=${balance}&userdetail=${userdetail}&msg=${msg}`);
                                
                            }
                        })
                    }else{
                        let wrong_pass="Password in incorrect";
                        
                    }
                }
            }
        })
    }catch{
        console.log("error in login ")
    }

})

router.get('/userpage',authMiddleware,(req,res)=>{
    const {msg } = req.query;
    const email=req.userdetail.email;
    const password=req.userdetail.password;
    const userdetail=req.userdetail;
    const tablename=email+password.substring(0,10).toLowerCase();
    db.query(`select * from \`${tablename}\``,(err,result)=>{
        if(err){
            console.log(err,"get route");
        }else{
            let balance=result;
            res.render('userpage',{balance,userdetail,msg})
        }
    })
})


router.post('/userpage/income', authMiddleware, async (req, res) => {
    const income = req.body.income;
    const email = req.userdetail.email;
    const password = req.userdetail.password;
    const tablename = email + password.substring(0,10).toLowerCase();

    try {
        let q = `SELECT total_amount FROM \`${tablename.toString()}\``;
        db.query(q,(err,result)=>{
         if(err){
             console.log("error in retrieving amount",err);
         }else{
            const total = result.length > 0 ? Number(result[result.length-1].total_amount) : 0; 
            const newtotal = total + Number(income);
         var today = new Date();
         var year = today.getFullYear();
         var month = today.getMonth() + 1;
         var day = today.getDate();
 
         var formattedDate = year + '-' + (month < 10 ? '0' : '') + month + '-' + (day < 10 ? '0' : '') + day;
         db.query(`INSERT INTO \`${tablename}\`(date,income,total_amount)values (?,?,?)`,[formattedDate,income,newtotal],(err,result)=>{
             if(err){
                 console.log("error in entering income",err);
             }else{
                 db.query("update usertable SET amount=? where email=? AND password=?",[newtotal,email,password],(err,result)=>{
                     if(err){
                         console.log("updating usertable",err);
                     }else{
                         db.query(`select * from \`${tablename}\``,(err,resultt)=>{
                             if(err){
                                 console.log("expenses",err)
                             }else{
                                console.log("added income")
                                 let balance=resultt;
                                 let userdetail=req.userdetail
                                 let msg="ADDED INCOME"
                                // res.render('userpage',{balance,userdetail,msg})
                                res.redirect('/userpage?msg=' + encodeURIComponent(msg));
                             }
                         })
                     }
                 })
             }
         })
 
         }
        })
     } catch (error) {
         console.log("Error in updating expenses:", error);
         res.status(500).send("Internal Server Error");
     }
});


router.post('/userpage/expense',authMiddleware,async(req,res)=>{
    const expense = req.body.expense;
    const email = req.userdetail.email;
    const password = req.userdetail.password;
    const tablename = email + password.substring(0,10).toLowerCase();

    try {
        let q = `SELECT total_amount FROM \`${tablename}\``;
       db.query(q,(err,result)=>{
        if(err){
            console.log("error in retrieving amount",err);
        }else{
            const total = result.length > 0 ? Number(result[result.length-1].total_amount) : 0; // Extract total_amount from the result array
            
        const newtotal = total -Number(expense);
        var today = new Date();
        var year = today.getFullYear();
        var month = today.getMonth() + 1;
        var day = today.getDate();

        var formattedDate = year + '-' + (month < 10 ? '0' : '') + month + '-' + (day < 10 ? '0' : '') + day;
        db.query(`INSERT INTO \`${tablename}\`(date,expense,total_amount)values (?,?,?)`,[formattedDate,expense,newtotal],(err,result)=>{
            if(err){
                console,log("error in entering expense",err);
            }else{
                db.query("update usertable SET amount=? where email=? AND password=?",[newtotal,email,password],(err,result)=>{
                    if(err){
                        console.log("updating usertable",err);
                    }else{
                        db.query(`select * from \`${tablename}\``,(err,resultt)=>{
                            if(err){
                                console.log("expenses",err)
                            }else{
                                let msg="DEDUCTED EXPENSES";
                                console.log(msg)
                                let balance=resultt;
                                let userdetail=req.userdetail
                               // res.render('userpage',{balance,userdetail,msg})
                                res.redirect('/userpage?msg=' + encodeURIComponent(msg));
                            }
                        })
                    }
                })
            }
        })

        }
       })
    } catch (error) {
        console.log("Error in updating expenses:", error);
        res.status(500).send("Internal Server Error");
    }
})

router.post('/userpage/delete',authMiddleware,async(req,res)=>{
    try{
        trans_id=req.body.id;
        const email = req.userdetail.email;
        const password = req.userdetail.password;
        const tablename = email + password.substring(0,10).toLowerCase();
        db.query(`delete from \`${tablename}\` where transaction_id=?`,[trans_id],async(err,result)=>{
            if(err){
                console.log("error in deleting",err)
            }else{
               db.query(`select * from \`${tablename}\``,(err,result)=>{
                if(err){
                    console.log("error in delete part",err)
                }else{
                    let balance=result;
                    let msg="TRANSACTION DELETED"
                    let userdetail=req.userdetail
                    console.log("done deleting")
                    //res.render("userpage",{balance,userdetail,msg})
                    res.redirect('/userpage?msg=' + encodeURIComponent(msg));
                }
               });

                
            }
        })


    }catch(error){
        console.log("Error in deleting transation", error);
        res.status(500).send("Internal Server Error");
    }
})

router.post('/userpage/transactiondetail',authMiddleware,async(req,res)=>{
    const from=req.body.fromdate;
    const todate=req.body.todate;
    const email = req.userdetail.email;
    const password = req.userdetail.password;
    const tablename = email + password.substring(0,10).toLowerCase();
    try{
        let q=`SELECT * FROM \`${tablename}\` WHERE date BETWEEN ? AND ?`;
         db.query(q,[from,todate],(err,result)=>{
            if(err){
                console.log("error in fetching data period ", err)
            }else{
                let balance=result
                console.log(balance)
                let userdetail=req.userdetail
                res.render('balance',{balance,userdetail})
                
            }
         });

    
    }catch(error){
        console.log("Error in retreiving transation", error);
        res.status(500).send("Internal Server Error");
    }

    

})


module.exports = router;