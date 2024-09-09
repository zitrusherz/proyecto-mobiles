/*import { Injectable } from '@angular/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import * as bcrypt from 'bcryptjs';
@Injectable({
  providedIn: 'root',
})
export class DatabaseService {
  private db: SQLiteDBConnection | null = null;
  private sqlite: SQLiteConnection;

  constructor() {
    this.sqlite = new SQLiteConnection(CapacitorSQLite);
    this.init();
  }

  private async init() {
    try {
      
      this.db = await this.sqlite.createConnection('RegistrAPP', true, 'aes-256-cbc', 1, false);

      
      await this.db.open();

      
      if (await this.db.isDBOpen()) {
        await this.createTables();
      } else {
        console.error('Failed to open SQLite database');
      }
    } catch (err) {
      console.error('Error initializing database', err);
    }
  }

  private async createTables() {
    if (this.db) {
      const query = `
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          primerNombre TEXT,
          segundoNombre TEXT,
          primerApellido TEXT,
          segundoApellido TEXT,
          email TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          role TEXT NOT NULL
        );
      `;
      await this.db.execute(query);
    }
  }

  async addUser(primerNombre: string, segundoNombre: string, primerApellido: string, segundoApellido: string, email: string, password: string, role: string) {
    if (this.db) {
      
      const hashedPassword = await bcrypt.hash(password, 10);
      const query = `
        INSERT INTO users (primerNombre, segundoNombre, primerApellido, segundoApellido, email, password, role)
        VALUES (?, ?, ?, ?, ?, ?, ?);
      `;
      try {
        await this.db.run(query, [primerNombre, segundoNombre, primerApellido, segundoApellido, email, hashedPassword, role]);
        console.log('User added successfully');
      } catch (error) {
        console.error('Error adding user', error);
      }
    }
  }

  async addQRCode(code: string, userId: number) {
    if (this.db) {
      const query = `INSERT INTO qr_codes (code, user_id) VALUES (?, ?);`;
      await this.db.run(query, [code, userId]);
    }
  }

  async updateUser(id: number, primerNombre: string, segundoNombre: string, primerApellido: string, segundoApellido: string, email: string, password: string) {
    if (this.db) {
      const query = `
        UPDATE users
        SET primerNombre = ?, segundoNombre = ?, primerApellido = ?, segundoApellido = ?, email = ?, password = ?
        WHERE id = ?;
      `;
      await this.db.run(query, [primerNombre, segundoNombre, primerApellido, segundoApellido, email, password, id]);
    }
  }
  // Otros métodos para consultar, eliminar o actualizar datos...
}*/
