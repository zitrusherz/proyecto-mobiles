import {Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {Device} from '@capacitor/device';
import {CapacitorSQLite, SQLiteConnection, SQLiteDBConnection,} from '@capacitor-community/sqlite';
import {Preferences} from '@capacitor/preferences';

@Injectable({
  providedIn: 'root',
})
export class SqliteService {
  public static readonly dbReady: BehaviorSubject<boolean> =
    new BehaviorSubject(false);
  private static db?: SQLiteDBConnection;
  public static isWeb: boolean = false;
  public static isIOS: boolean = false;
  private static readonly defaultDbName: string = 'RegistrAPP';
  public static isDbConnected: boolean = false;

  constructor() {
    console.log('constructor');
    this.init();
  }

  async init() {
    console.log('init');
    const info = await Device.getInfo();
    const sqlite = CapacitorSQLite as any;

    if (info.platform === 'android') {
      try {
        await sqlite.requestPermissions();
        await SqliteService.ensureDbReady();
      } catch (e) {
        console.error(
          'Esta app necesita permisos para funcionar correctamente',
          e
        );
      }
    } else if (info.platform === 'web') {
      SqliteService.isWeb = true;
      try {
        await sqlite.initWebStore();
        await SqliteService.ensureDbReady();
        console.log('Web store initialized');
      } catch (e) {
        console.error(e);
      }
    } else if (info.platform === 'ios') {
      SqliteService.isIOS = true;
      await SqliteService.ensureDbReady();
    }
  }

  static async closeDbConnection(): Promise<void> {
    console.log('closeDbConnection');
    if (SqliteService.db) {
      try {
        await SqliteService.db.close();
        SqliteService.isDbConnected = false;
        console.log('Database connection closed');
      } catch (error) {
        console.error('Error closing database connection:', error);
      }
    } else {
      console.log('No database connection to close.');
    }
  }

  static async getDbConnection(): Promise<SQLiteDBConnection | undefined> {
    console.log('getDbConnection');
    if (SqliteService.isDbConnected && SqliteService.db) {
      console.log('La conexión a la base de datos ya está establecida');
      return SqliteService.db;
    }

    try {
      await SqliteService.setupDataBase();

      SqliteService.isDbConnected = true;
      console.log('Conexión a la base de datos establecida en getDbConnection');

      return SqliteService.db;
    } catch (error) {
      console.error('Error al obtener la conexión a la base de datos:', error);

      return undefined;
    }
  }

  static async ensureDbReady(): Promise<void> {
    console.log('ensureDbReady called');

    if (SqliteService.dbReady.getValue()) {
      console.log('Base de datos ya está lista.');
      return;
    }

    if (!SqliteService.db) {
      console.log('Obteniendo conexión a la base de datos...');
      SqliteService.db = await SqliteService.getDbConnection();
    }

    if (!SqliteService.isDbConnected) {
      try {
        console.log('Inicializando la base de datos...');
        await SqliteService.setupDataBase();
        SqliteService.isDbConnected = true;
        SqliteService.dbReady.next(true); // Marcar como lista
        console.log('La base de datos está conectada y lista para su uso.');
      } catch (error) {
        console.error(
          'Error al asegurar la conexión con la base de datos:',
          error
        );
        throw new Error('Error en la conexión con la base de datos');
      }
    } else {
      console.log('La conexión a la base de datos ya está establecida.');
    }
  }

  static async setupDataBase() {
    console.log('setupDataBase');
    const sqlite = new SQLiteConnection(CapacitorSQLite);

    if (SqliteService.db || SqliteService.dbReady.getValue()) {
      console.log(
        'La conexión a la base de datos ya está establecida en setupDataBase'
      );
      return;
    }

    console.time('Database setup');

    try {
      const { dbName } = await SqliteService.loadConfiguration();
      console.log('Nombre de la base de datos:', dbName);
      SqliteService.db = await sqlite.createConnection(
        dbName,
        false,
        'no-encryption',
        1,
        false
      );

      await SqliteService.db.open();
      console.log('Conexión a la base de datos abierta');

      await SqliteService.createTables(); // Asegurarse de que createTables sea estática
      console.log('Tablas creadas');

      SqliteService.dbReady.next(true);
      console.log('Conexión a la base de datos establecida');

      SqliteService.isDbConnected = true;
      console.timeEnd('Database setup');
    } catch (error) {
      console.error('Error al crear o abrir la base de datos:', error);
      SqliteService.isDbConnected = false;
      console.timeEnd('Database setup');
    }
  }

  static async createTables() {
    console.log('createTables');
    if (!SqliteService.db) {
      throw new Error('La base de datos no está conectada');
    }

    const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      primerNombre TEXT NOT NULL,
      segundoNombre TEXT,
      primerApellido TEXT NOT NULL,
      segundoApellido TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      recoveryCode TEXT NOT NULL
    );
  `;

    try {
      await SqliteService.db.execute(createUsersTable);
      console.log('Tablas creadas con éxito');
    } catch (error) {
      console.error('Error al crear las tablas:', error);
    }
  }

  async userExists(email: string): Promise<boolean> {
    console.log('userExists');

    try {
      await SqliteService.ensureDbReady();

      if (!SqliteService.db) {
        console.error('No se pudo obtener la conexión a la base de datos');
        return false;
      }

      const query = `SELECT COUNT(*) as count FROM users WHERE email = ?`;
      const result = await SqliteService.db.query(query, [email]);
      console.log('Result:', result);

      let count = 0;
      if (Array.isArray(result.values)) {
        if (result.values.length > 0) {
          count = Array.isArray(result.values[0]) ? result.values[0][0] : 0;
        }
      } else if (typeof result.values === 'object' && result.values !== null) {
        count = result.values['count'] || 0;
      }

      console.log('Cantidad de usuarios encontrados:', count);
      return count > 0;
    } catch (error) {
      const errMessage = (error as Error).message || 'Error desconocido';
      console.error('Error al verificar existencia de usuario:', errMessage);
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
    role: string,
    recoveryCode: string
  ): Promise<void> {
    console.log('addUser');
    if (!SqliteService.db || !SqliteService.isDbConnected) {
      console.error('No hay conexión a la base de datos disponible.');
      throw new Error('No hay conexión a la base de datos disponible.');
    }
    try {
      await SqliteService.ensureDbReady();

      if (SqliteService.db) {
        const query = `
        INSERT INTO users (primerNombre, segundoNombre, primerApellido, segundoApellido, email, password, role, recoveryCode)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?);
      `;
        console.log('Añadiendo usuario a la base de datos...');

        await SqliteService.db.run(query, [
          primerNombre,
          segundoNombre,
          primerApellido,
          segundoApellido,
          email,
          password,
          role,
          recoveryCode,
        ]);

        console.log('Usuario añadido exitosamente');
        console.log('Usuario:', {
          primerNombre,
          segundoNombre,
          primerApellido,
          segundoApellido,
          email,
          password,
          role,
          recoveryCode,
        });
      } else {
        throw new Error('Conexión a la base de datos no establecida');
      }
    } catch (error) {
      const errMessage = (error as Error).message || 'Error desconocido';
      console.error('Error al añadir el usuario:', errMessage);
      throw error;
    }
  }

  static async getUserDetailsByEmail(email: string): Promise<any | null> {
    console.log('getUserDetailsByEmail');
    try {
      await SqliteService.ensureDbReady();

      const db = SqliteService.db;

      if (!db) {
        console.error('No se pudo obtener la conexión a la base de datos');
        return null;
      }

      const query = `SELECT primerNombre, segundoNombre, primerApellido, segundoApellido, email, password, role, recoveryCode FROM users WHERE email = ?`;
      const result = await db.query(query, [email]);

      console.log('Resultado de la consulta:', result);

      if (result?.values && result.values.length > 0) {
        const userRow = result.values[0];

        console.log('Verificando contenido de userRow:', userRow);

        if (Array.isArray(userRow)) {
          const user = {
            primerNombre: userRow[0],
            segundoNombre: userRow[1],
            primerApellido: userRow[2],
            segundoApellido: userRow[3],
            email: userRow[4],
            password: userRow[5],
            role: userRow[6],
            recoveryCode: userRow[7],
          };
          console.log('Usuario creado (array):', user);
          return user;
        } else if (typeof userRow === 'object') {
          const user = {
            primerNombre: userRow.primerNombre,
            segundoNombre: userRow.segundoNombre,
            primerApellido: userRow.primerApellido,
            segundoApellido: userRow.segundoApellido,
            email: userRow.email,
            password: userRow.password,
            role: userRow.role,
            recoveryCode: userRow.recoveryCode,
          };
          console.log('Usuario creado (objeto):', user);
          return user;
        } else {
          console.error(
            'El formato de userRow no es ni array ni objeto:',
            userRow
          );
          return null;
        }
      } else {
        console.warn('No se encontró el usuario con el email proporcionado.');
        return null;
      }
    } catch (error) {
      console.error('Error al recuperar detalles del usuario:', error);
      return null;
    }
  }

  async updateUser(
    id: number,
    primerNombre?: string,
    segundoNombre?: string,
    primerApellido?: string,
    segundoApellido?: string,
    email?: string,
    password?: string,
    recoveryCode?: string
  ) {
    console.log('updateUser');
    if (!SqliteService.db || !SqliteService.isDbConnected) {
      console.error('No hay conexión a la base de datos disponible.');
      throw new Error('No hay conexión a la base de datos disponible.');
    }
    if (SqliteService.db) {
      console.log('Updating user...');
      try {
        let query = 'UPDATE users SET ';
        const params: any[] = [];

        if (primerNombre) {
          query += 'primerNombre = ?, ';
          params.push(primerNombre);
        }

        if (segundoNombre) {
          query += 'segundoNombre = ?, ';
          params.push(segundoNombre);
        }

        if (primerApellido) {
          query += 'primerApellido = ?, ';
          params.push(primerApellido);
        }

        if (segundoApellido) {
          query += 'segundoApellido = ?, ';
          params.push(segundoApellido);
        }

        if (email) {
          query += 'email = ?, ';
          params.push(email);
        }

        if (password) {
          query += 'password = ?, ';
          params.push(password);
        }

        if (recoveryCode) {
          query += 'recoveryCode = ?, ';
          params.push(recoveryCode);
        }

        query = query.slice(0, -2);

        query += ' WHERE id = ?';
        params.push(id);

        await SqliteService.db.run(query, params);
        console.log('User updated successfully');
      } catch (error) {
        console.error('Error updating user', error);
        throw error;
      }
    } else {
      throw new Error('Database connection not established');
    }
  }

  async getRecoveryCodeByEmail(email: string): Promise<string | null> {
    console.log('getRecoveryCodeByEmail');
    if (!SqliteService.db) {
      throw new Error('Base de datos no está conectada');
    }

    const query = `SELECT recoveryCode FROM users WHERE email = ?`;
    try {
      const result = await SqliteService.db.query(query, [email]);
      if (result.values && result.values.length > 0) {
        return result.values[0][0];
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error al obtener el código de recuperación:', error);
      throw error;
    }
  }

  async setPreference(key: string, value: string) {
    console.log('setPreference');
    await Preferences.set({ key, value });
  }

  async getPreference(key: string): Promise<string | null> {
    console.log('getPreference');
    const { value } = await Preferences.get({ key });
    return value;
  }

  async removePreference(key: string) {
    console.log('removePreference');
    await Preferences.remove({ key });
  }

  async saveConfiguration(dbName: string) {
    console.log('saveConfiguration');
    try {
      await Preferences.set({ key: 'dbName', value: dbName });
      console.log('Configuración guardada exitosamente');
    } catch (error) {
      console.error(
        'Error al guardar la configuración:',
        (error as Error).message || 'Error desconocido'
      );
    }
  }

  static async loadConfiguration() {
    console.log('loadConfiguration');
    try {
      const { value: dbName } = await Preferences.get({ key: 'dbName' });
      return {
        dbName: dbName ?? SqliteService.defaultDbName,
      };
    } catch (error) {
      console.error(
        'Error al cargar la configuración:',
        (error as Error).message || 'Error desconocido'
      );
      return {
        dbName: SqliteService.defaultDbName,
      };
    }
  }

  async getAllUsers(): Promise<any[]> {
    console.log('getAllUsers');
    try {
      await SqliteService.ensureDbReady();

      if (!SqliteService.db) {
        console.error('No se pudo obtener la conexión a la base de datos');
        return [];
      }

      const query = `SELECT * FROM users`;

      const result = await SqliteService.db.query(query);

      console.log('Result:', result);

      if (result.values && result.values.length > 0) {
        return result.values;
      } else {
        console.warn('No se encontraron usuarios en la tabla.');
        return [];
      }
    } catch (error) {
      console.error('Error al obtener todos los usuarios:', error);
      return [];
    }
  }
}
