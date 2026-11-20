import {PGlite} from '@electric-sql/pglite';
import fs from 'node:fs';import assert from 'node:assert/strict';
const db=new PGlite();const id=n=>`00000000-0000-0000-0000-${String(n).padStart(12,'0')}`;
await db.exec(fs.readFileSync(new URL('./exported-schema-fixture.sql',import.meta.url),'utf8'));
await db.exec(`
insert into users(id,name,email,role,status) values('${id(1)}','Admin','admin@example.test','Admin','Active'),('${id(2)}','Cashier','cashier@example.test','Cashier','Active');
select set_config('test.uid','${id(1)}',false);
insert into categories(id,name) values('${id(10)}',' Food '),('${id(11)}','Beverages');
insert into customers(id,name,mobile) values('${id(3)}','Customer','0771111111');
insert into products(id,name,category_id,price,stock,is_stock_item,status) values
('${id(4)}','Tea','${id(10)}',100,10,false,'Active'),
('${id(5)}','Cake','${id(10)}',50,5,false,'Active'),
('${id(6)}','Service','${id(11)}',10,0,true,'Active');
select create_pos_order('${id(3)}','Customer',null,'Takeaway','Cash','Paid',0,5,null,
 '[{"product_id":"${id(4)}","quantity":2}]'::jsonb);
update orders set id='${id(7)}',order_number='#KT1';
update order_items set id='${id(8)}',order_id='${id(7)}',product_name='Tea historical';
`);
await db.exec(fs.readFileSync(new URL('../database/02_order_item_edit.sql',import.meta.url),'utf8'));
const read=async()=>{const {rows:[o]}=await db.query("select * from orders where order_number='#KT1'");const {rows:items}=await db.query('select * from order_items where order_id=$1 order by id',[o.id]);const keys=['customer_id','customer_name','customer_phone','order_type','order_status','payment_method','payment_status','notes','subtotal','discount','tax','total'];return {header:Object.fromEntries(keys.map(k=>[k,['subtotal','discount','tax','total'].includes(k)?Number(o[k]):o[k]])),items:items.map(i=>({id:i.id,product_id:i.product_id,product_name:i.product_name,quantity:i.quantity,unit_price:Number(i.unit_price),notes:i.notes}))};};
const edit=async(expected,items,header={},request=crypto.randomUUID())=>(await db.query('select edit_completed_pos_order($1,$2,$3,$4,$5) result',['#KT1',request,expected,{customer_name:'Customer',customer_phone:null,order_type:'Takeaway',payment_method:'Cash',payment_status:'Paid',notes:null,discount:0,...header},items])).rows[0].result;
const stock=async p=>Number((await db.query('select stock from products where id=$1',[p])).rows[0].stock);
const spent=async()=>Number((await db.query('select total_spent from customers')).rows[0].total_spent);
const orig=await read();const lines=[{id:id(8),product_id:id(4),quantity:3,unit_price:100},{product_id:id(5),quantity:2,unit_price:50}];const request=crypto.randomUUID();
let result=await edit(orig,lines,{},request);assert.equal(Number(result.total),420);assert.equal(await stock(id(4)),7);assert.equal(await stock(id(5)),3);assert.equal(await spent(),420);console.log('PASS add product, increase quantity, historical price/name, tax, stock, customer total');
await edit(orig,lines,{},request);assert.equal(await stock(id(4)),7);assert.equal((await db.query('select count(*)::int n from pos_order_edit_audit')).rows[0].n,1);console.log('PASS retry is idempotent');
await assert.rejects(edit(orig,lines),/changed since/);console.log('PASS stale edit rejected');
let current=await read();const before=JSON.stringify(current);await assert.rejects(edit(current,[{id:id(8),product_id:id(4),quantity:999,unit_price:100}]),/Insufficient stock/);assert.equal(JSON.stringify(await read()),before);assert.equal(await stock(id(4)),7);assert.equal(await stock(id(5)),3);console.log('PASS insufficient stock rolls back transaction');
for(const items of [[],[{id:id(8),product_id:id(4),quantity:0,unit_price:100}],[{id:id(8),product_id:id(4),quantity:1.5,unit_price:100}],[{id:id(8),product_id:id(4),quantity:1,unit_price:-1}]])await assert.rejects(edit(current,items));await assert.rejects(edit(current,lines,{discount:9999}),/Discount/);console.log('PASS invalid quantities/prices/discount and empty order rejected');
await db.exec(`select set_config('test.uid','${id(2)}',false)`);await assert.rejects(edit(current,lines),/administrator/);await db.exec("select set_config('test.uid','',false)");await assert.rejects(edit(current,lines),/sign in/);await db.exec(`select set_config('test.uid','${id(1)}',false)`);console.log('PASS cashier and anonymous denied');
result=await edit(current,[{id:id(8),product_id:id(4),quantity:1,unit_price:90}],{discount:10,payment_status:'Pending'});assert.equal(Number(result.total),84.5);assert.equal(await stock(id(4)),9);assert.equal(await stock(id(5)),5);assert.equal(await spent(),0);console.log('PASS removal, quantity decrease, price/discount and payment edits');
current=await read();result=await edit(current,[{id:id(8),product_id:id(4),quantity:1,unit_price:90},{product_id:id(6),quantity:3,unit_price:10}]);assert.equal(await stock(id(6)),0);console.log('PASS untracked product stock unchanged');
current=await read();await db.exec('create function test_trigger() returns trigger language plpgsql as $$begin return new; end;$$;create trigger custom_business before update on orders for each row execute function test_trigger();');await assert.rejects(edit(current,lines),/triggers differ/);console.log('PASS unknown business triggers fail safely');await db.exec('drop trigger custom_business on orders');
await db.exec(`update order_items set product_id=null where id='${id(8)}'`);current=await read();result=await edit(current,[{id:id(8),product_id:null,quantity:2,unit_price:90}]);assert.equal(result.order_items[0].product_name,'Tea historical');console.log('PASS deleted-product historical line');
// Multiple existing lines for one product: release decreases before applying increases.
current=await read();
result=await edit(current,[{product_id:id(4),quantity:4,unit_price:100},{product_id:id(4),quantity:6,unit_price:100}]);
assert.equal(await stock(id(4)),0);
current=await read();
const first=current.items[0], second=current.items[1];
result=await edit(current,[{id:first.id,product_id:id(4),quantity:first.quantity+second.quantity-1,unit_price:100},{id:second.id,product_id:id(4),quantity:1,unit_price:100}]);
assert.equal(await stock(id(4)),0);console.log('PASS duplicate-product redistribution at zero stock');
// Replace a product line by a new line for that same product, with zero free stock.
current=await read();result=await edit(current,[{product_id:id(4),quantity:10,unit_price:100}]);assert.equal(await stock(id(4)),0);console.log('PASS removal releases stock before replacement');
current=await read();await db.exec("update orders set is_deleted=true where order_number='#KT1'");await assert.rejects(edit(current,[{product_id:id(4),quantity:1,unit_price:100}]),/deleted order/);await db.exec("update orders set is_deleted=false where order_number='#KT1'");console.log('PASS soft-deleted order rejected');
// Generated totals are never written directly.
const {rows:generated}=await db.query('select quantity,unit_price,line_total from order_items');for(const line of generated)assert.equal(Number(line.line_total),line.quantity*Number(line.unit_price));console.log('PASS generated line_total');
// Verify mismatch/missing trigger fails instead of silently skipping Food stock.
await db.exec('alter table order_items disable trigger trg_order_items_product_stock');await assert.rejects(edit(await read(),[{product_id:id(4),quantity:1,unit_price:100}]),/triggers differ/);console.log('PASS disabled stock trigger rejected');
await db.exec('alter table order_items enable trigger trg_order_items_product_stock');
await db.exec(fs.readFileSync(new URL('../database/02_order_item_edit.sql',import.meta.url),'utf8'));
console.log('PASS migration can be reapplied without changing existing triggers');
current=await read();
await db.exec('set role authenticated');
result=await edit(current,current.items.map(i=>({id:i.id,product_id:i.product_id,quantity:i.quantity,unit_price:i.unit_price})));assert.equal(Number(result.total),1050);
await assert.rejects(db.query('select * from public.pos_order_edit_audit'),/permission denied/);
await db.exec('reset role; set role anon');await assert.rejects(edit(current,lines),/permission denied/);await db.exec('reset role');
console.log('PASS authenticated admin RPC, private audit and anonymous execution privileges');
console.log('ALL DATABASE TESTS PASSED');await db.close();
