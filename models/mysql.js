var mysql = require('mysql');

var connections={};

var Model = function(opt,logger) {
    var connection=null;
    var _fields;

    var connect = function (cb) {
        var token=opt.host+':'+opt.database;
        if (connection!=null) {
            cb();
        } else if (connections[token]!==undefined){
            connection=connections[token];
            cb();
        } else {
            connection=mysql.createConnection(opt);
            connection.connect(function(err){
                if(!err) {
                    connections[token]=connection;
                    logger.log('Database '+opt.database+' is connected','db');
                    cb();
                } else {
                    connection=null;
                    console.log('Error connecting database '+opt.database,'error',err);
                }
            });        
        }
    }
    
    var getFields = function(cb) {
        
        var sql="SELECT column_name,data_type FROM information_schema.columns WHERE table_schema='"+opt.database+"' AND table_name='"+opt.table+"'";
        connection.query(sql, function(err, rows, fields) {
            _fields={};
            for (var i=0; i<rows.length; i++) {
                _fields[rows[i].column_name]=rows[i].data_type;
            }
            if (cb) cb();
        });
    }
    
    var addslashes = function(key,val) {
        var type=_fields[key];
        
        switch (type) {
            case 'int': {
                return val;
            }
            default: {
                return "'"+val+"'";
            }
        }
    }
    
    var indexCondition = function (idx) {
        var where='';
        
        if (typeof(idx)=='object') {
            for (var i=0;i<opt.index.length; i++) {
                if (where.length>0) where+=' AND ';
                where+=opt.index[i]+'='+addslashes(opt.index[i],idx[opt.index[i]]);
            }
        } else {
            where=opt.index[0]+'='+addslashes(opt.index[0],idx);
        }
        
        return where;
    };
    
    var addFieldSql = function (k,v,cb) {
        sql='ALTER TABLE '+opt.table+' ADD '+k+' ';
        switch (typeof(v)) {
            case 'numeric':
                sql+='numeric';
                break;
            case 'string':
                sql+='text';
        }
        
        return sql;

        
    };
    
    var checkFields = function (d,cb) {
        var sql='';
    
        for (var k in d) {
            if (_fields[k]===undefined) {
                sql+=addFieldSql(k,d[k])+';';
            }
        }
        if (sql.length==0) {
            cb();
        } else {
            connection.query(sql, function(err, rows, fields) {
                if (!err) {
                    getFields(cb);
                }
            });            
        }
       
    }
    
    var where2whereObj = function(where,cb) {
        var obj={};
        for (var i=0; i<where.length; i++) {
            for (var k in where[i]) {
                obj[k]=where[i];
            }
        }
        checkFields(obj,function(){
            var ors=[],ands;
            var v=[];
            for (var i=0; i<where.length; i++) {
                ands=[];
                for (var k in where[i]) {
                    ands.push(k+'=?');
                    v.push(where[i]);
                }
                ors.push('('+ands.join(' AND ')+')');
            }
            cb({where:ors.join(' OR '),values:v});
            
        });
    }
    
    return {
        init: function () {
            connect(function(){
                var sql='SELECT * FROM information_schema.tables WHERE table_schema = \''+opt.database+'\' AND table_name = \''+opt.table+'\' LIMIT 1;';
                connection.query(sql, function(err, rows, fields) {
                    if (rows.length==0) {
                        sql='CREATE TABLE '+opt.table+' (';
                        for (var i=0;i<opt.index.length;i++) {
                            sql+=opt.index[i]+' INT(6) UNSIGNED AUTO_INCREMENT PRIMARY KEY, ';
                        }
                        sql+='_created INT(6), ';
                        sql+='_updated INT(6)';
                        sql+=');';
                        connection.query(sql,function() {
                            getFields();
                        });
                    } else {
                        getFields();
                    }
                    
                });

            });
        },
        
        getAll: function(cb) {
            var sql='SELECT * FROM '+opt.table;
            connection.query(sql, function(err, rows, fields) {
                cb({recordsTotal:rows.length,data:rows});
            });
            
        },
        
        get: function(idx) {
        },
        
        select: function (where,order,cb) {
            var sql="SELECT * FROM "+opt.table;
            var orderby='';
            if (order) orderby=' ORDER BY '+order.join(',');
            
            if (where) {
                where2whereObj(where,function(obj){
                    sql+=' WHERE '+obj.where;
                    connection.query(sql+orderby,obj.values,function(err, rows) {
                        if (!err) cb({recordsTotal:rows.length,data:rows});
                    });
                });
            } else {
                 connection.query(sql+orderby,function(err, rows) {
                    if (!err) cb({recordsTotal:rows.length,data:rows});
                });
            }
        },
        
        set: function(d,idx,cb) {
            var set='_updated=?';
            var values=[Date.now()];
            
            checkFields(d,function(){
                for (var k in d) {
                    if (k=='_updated' || k=='_created') {
                        continue;
                    }
                    
                    set+=', '+k+'=?';
                    values.push(d[k]);
                }
                            
                var sql='UPDATE '+opt.table+' SET '+set+' WHERE '+indexCondition(idx);
                connection.query(sql, values, function(err, rows, fields) {
                    if (!err && cb!=null) cb(); 
                });
            });
        },
        
        count: function(where,cb) {
            var sql="SELECT count(*) AS c FROM "+opt.table;
            if (where) {
                where2whereObj(where,function(obj){
                    sql+=' WHERE '+obj.where;
                    connection.query(sql,obj.values,function(err, rows) {
                        if (!err) cb(rows[0].c);
                    });
                });
            } else {
                 connection.query(sql,function(err, rows) {
                    if (!err) cb(rows[0].c);
                });
            }
            
        },
        
        add: function(d,cb) {
            var inserts='_created,_updated';
            var values=Date.now()+','+Date.now();
            
            d._created=Date.now();
            d._updated=Date.now();
            
            checkFields(d,function(){
                connection.query('INSERT INTO '+opt.table+' SET ?',d,function(err,res){
                    if (!err) cb(res.insertId);
                });
            });
            
        },
        
        remove: function (idx) {
        },
        
        index: function(data) {
        },
        
        max: function(element,where) {
        },
        
        ultimateSave: function () {
        }
    }
}


module.exports = Model;