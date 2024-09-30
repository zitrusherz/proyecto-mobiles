import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Device } from '@capacitor/device';
import { CapacitorSQLite, SQLiteDBConnection, SQLiteConnection } from '@capacitor-community/sqlite';
import { Preferences } from '@capacitor/preferences';
import * as bcrypt from 'bcryptjs';



@Injectable({
  providedIn: 'root'
})
export class SqliteService {
  public dbReady: BehaviorSubject<boolean>;
  private db?: SQLiteDBConnection;
  public isWeb: boolean;
  public isIOS: boolean;
  private readonly defaultDbName: string = 'RegistrAPP';
  private readonly defaultEncryptionKey: string = 'Zitrus:3!';

  constructor() {
    this.dbReady = new BehaviorSubject(false);
    this.isWeb = false;
    this.isIOS = false;
    this.init();
  }

  async init() {
    const info = await Device.getInfo();
    const sqlite = CapacitorSQLite as any;
  
    if (info.platform === 'android') {
      try {
        await sqlite.requestPermissions();
        await this.setupDataBase();
      } catch (e) {
        console.error('Esta app necesita permisos para funcionar correctamente');
      }
    } else if (info.platform === 'web') {
      this.isWeb = true;
      try {
        await sqlite.initWebStore(); 
        await this.setupDataBase(); 
        this.dbReady.next(true);
      } catch (e) {
        console.error(e);
      }
    } else if (info.platform === 'ios') {
      this.isIOS = true;
      await this.setupDataBase();
    }
  }
  

  async setupDataBase() {
    const sqlite = new SQLiteConnection(CapacitorSQLite);
    const info = await Device.getInfo();
    if (this.db) {
      this.dbReady.next(true);
      return;
    }
  
    try {
      
      if (this.isIOS || info.platform === 'android') {
        const { dbName, encryptionKey } = await this.loadConfigurationPhone();
        this.db = await sqlite.createConnection(
          dbName,
          true,
          'encryption',
          1,
          false
        );
        await this.db.open();
        await sqlite.setEncryptionSecret(encryptionKey);
      }else{
        const {dbName} = await this.loadConfigurationWeb()
        this.db = await sqlite.createConnection(
          dbName,
          false,
          'no-encryption',
          1,
          false
        );
        await this.db.open()
      }
  
      await this.createTables();
      this.dbReady.next(true);
    } catch (error) {
      console.error('Error al crear o abrir la base de datos:', error);
    }
  }
  

  getDbConnection(): SQLiteDBConnection | undefined {
    return this.db;
  }

  async createTables() {
    if (!this.db) {
      throw new Error('Base de datos no está conectada');
    }

    const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      primerNombre TEXT,
      segundoNombre TEXT,
      primerApellido TEXT,
      segundoApellido TEXT,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      codeRecovery TEXT NOT NULL,
      role TEXT NOT NULL
    );
    `;

    try {
      await this.db.execute(createUsersTable);
    } catch (error) {
      console.error('Error al crear las tablas:', error);
    }
  }

  async userExists(email: string): Promise<boolean> {
    if (!this.db) {
      throw new Error('Base de datos no está conectada');
    }
  
    const query = `SELECT COUNT(*) as count FROM users WHERE email = ?`;
    try {
      const result = await this.db.query(query, [email]);
      const count = result.values && result.values.length > 0 ? result.values[0][0] : 0;
      return count > 0;
    } catch (error) {
      console.error('Error al verificar existencia de usuario', error);
      throw error;
    }
  }
  

  async addUser(
    primerNombre: string,
    segundoNombre: string,
    primerApellido: string,
    segundoApellido: string,
    email: string,
    password: string,
    codeRecovery: string,
    role: string
  ) {
    const info = await Device.getInfo();
    if (this.db && (this.isIOS || info.platform === 'android')) {
      try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const query = `
          INSERT INTO users (primerNombre, segundoNombre, primerApellido, segundoApellido, email, password, codeRecovery, role)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?);
        `;
        await this.db.run(query, [primerNombre, segundoNombre, primerApellido, segundoApellido, email, hashedPassword, codeRecovery, role]);
        console.log('User added successfully');
      } catch (error) {
        console.error('Error adding user', error);
        throw error;
      }
    } else if(this.db && info.platform === 'web') {
      const query = `
      INSERT INTO users (primerNombre, segundoNombre, primerApellido, segundoApellido, email, password, codeRecovery, role)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?);
        `;
        await this.db.run(query, [primerNombre, segundoNombre, primerApellido, segundoApellido, email, password, codeRecovery, role]);
        console.log('User added successfully');
    }else{
      throw new Error('Database connection not established');
    }
  }
  

  async updateUser(
    id: number,
    primerNombre: string,
    segundoNombre: string,
    primerApellido: string,
    segundoApellido: string,
    email: string,
    password?: string  
  ) {
    if (this.db) {
      try {
        let query = `
          UPDATE users
          SET primerNombre = ?, segundoNombre = ?, primerApellido = ?, segundoApellido = ?, email = ?
          WHERE id = ?;
        `;
        let params = [primerNombre, segundoNombre, primerApellido, segundoApellido, email, id];
  
        if (password) {
          const hashedPassword = await bcrypt.hash(password, 10);
          query = `
            UPDATE users
            SET primerNombre = ?, segundoNombre = ?, primerApellido = ?, segundoApellido = ?, email = ?, password = ?
            WHERE id = ?;
          `;
          params = [primerNombre, segundoNombre, primerApellido, segundoApellido, email, hashedPassword, id];
        }
  
        await this.db.run(query, params);
      } catch (error) {
        console.error('Error updating user', error);
        throw error;
      }
    } else {
      throw new Error('Database connection not established');
    }
  }
  

  async setPreference(key: string, value: string) {
    await Preferences.set({ key, value });
  }

  async getPreference(key: string): Promise<string | null> {
    const { value } = await Preferences.get({ key });
    return value;
  }

  async removePreference(key: string) {
    await Preferences.remove({ key });
  }

  async saveConfiguration(dbName: string, encryptionKey: string) {
    try {
      
      await Preferences.set({ key: 'dbName', value: dbName });
      const info = await Device.getInfo();
      if(this.isIOS || info.platform === 'android'){
        await Preferences.set({ key: 'encryptionKey', value: encryptionKey });
      }else{

      }
      console.log('Configuración guardada exitosamente');
    } catch (error) {
      console.error('Error al guardar la configuración:', error);
    }
  }

  
  async loadConfigurationWeb() {
    try {
      const { value: dbName } = await Preferences.get({ key: 'dbName' });
      
      return {
      dbName: dbName ?? this.defaultDbName,
        };
    } catch (error) {
      console.error('Error al cargar la configuración:', error);
      return {
        dbName: this.defaultDbName,
        
      };
    }
  }

  async loadConfigurationPhone() {
    try {
      const { value: dbName } = await Preferences.get({ key: 'dbName' });
      
      const { value: encryptionKey } = await Preferences.get({ key: 'encryptionKey' });
      return {
        dbName: dbName ?? this.defaultDbName,
        encryptionKey: encryptionKey ?? this.defaultEncryptionKey
      };
      
      
    } catch (error) {
      console.error('Error al cargar la configuración:', error);
      return {
        dbName: this.defaultDbName,
        encryptionKey: this.defaultEncryptionKey
      };
    }
  }

  private async isEncryptionSupported(): Promise<boolean> {
    const info = await Device.getInfo();
    return this.isIOS || info.platform === 'android';
  }
  

}


