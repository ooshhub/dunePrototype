/**
 * Base repository for CRUD operations on backend classes
 */

 export class BaseRepository {
 
   #store = {};
 
   constructor() {}
 
   all() { throw new Error(`${this.constructor.name}: Subclass failed to implement this method. `) }
 
   create() { throw new Error(`${this.constructor.name}: Subclass failed to implement this method. `) }
 
   read() { throw new Error(`${this.constructor.name}: Subclass failed to implement this method. `) }
 
   update() { throw new Error(`${this.constructor.name}: Subclass failed to implement this method. `) }
 
   delete() { throw new Error(`${this.constructor.name}: Subclass failed to implement this method. `) }
 
 }