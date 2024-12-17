import { Component , OnInit } from '@angular/core';
import { IonicCommonComponents } from '../components/ionic-common-components';
import { Barcode, BarcodeScanner, LensFacing } from '@capacitor-mlkit/barcode-scanning';
import { UserService } from 'src/app/services/user.service';
import {ToastController, AlertController, LoadingController, ModalController, Platform} from '@ionic/angular';
import { QrCodeModule } from 'ng-qrcode';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../services/supabase.service';
import {BarcodeScanningModalComponent} from './barcode-scanning-modal.component';
import { IonicModule } from '@ionic/angular';


@Component({
  selector: 'app-qr',
  templateUrl: 'qr.page.html',
  styleUrls: ['qr.page.scss'],
  standalone: true,
  imports: [  QrCodeModule, CommonModule,  IonicModule],  
})

export class QrPage implements OnInit {
  valueToEncode = '';
  isStudent: boolean;
  isProfessor: boolean;
  qrGenerationTime: Date | null = null;
  isSupported = true;
  barcodes: Barcode[] = [];
  scanResult = '';
  isScanning = false;
  errorMessage = ''; // Variable para almacenar errores en fase de debug
  correoProfesor = '';

  constructor( private userService: UserService,
    private toastCtrl: ToastController,
    private alertController: AlertController,
    private supabaseService: SupabaseService,
    private modalController: ModalController
    
  ) {
    this.isStudent = this.userService.getRole() === 'alumno';
    this.isProfessor = this.userService.getRole() === 'profesor';
  }
  ngOnInit() {
    BarcodeScanner.isSupported().then();
    BarcodeScanner.checkPermissions().then();
    BarcodeScanner.removeAllListeners();
  }
  async studentAttendance() {
    this.isScanning = true;
    this.errorMessage = ''; // Limpia errores previos

    try {
      const scanTime = new Date();

      // Escaneo del QR
      await this.starScan();
      if (!this.scanResult) {
        this.errorMessage = 'No se obtuvo ningún resultado del escaneo.';
        return;
      }

      // Procesar datos del QR y guardar asistencia
      const data = await this.supabaseService.getUserDetailsByEmail(this.userService.getEmail() || '');
      if (!data || !data.id) {
        this.errorMessage = 'No se encontraron detalles del usuario.';
        return;
      }
      
      const id_qr = await this.supabaseService.getQrId(this.scanResult);
      if (!id_qr) {
        this.errorMessage = 'No se pudo obtener el ID del QR.';
        return;
      }

      await this.supabaseService.saveAttendance( id_qr, Number(data.id));
      await this.supabaseService.getQrIdProfesor(this.scanResult);
      this.correoProfesor = await this.supabaseService.getEmailById(Number(data.id));
      this.sendEmail();
      this.presentToast('Asistencia guardada');
    } catch (error) {
      console.error('Error en la toma de asistencia:', error);
      this.errorMessage = `Error inesperado: ${(error as Error).message || error}`;
    } finally {
      this.isScanning = false; // Asegúrate de desactivar el spinner
    }
  }
//credito de barcode-scanning-modal.component.ts a https://youtu.be/dhTLpXuYGOI?t=2485 y su implementación
//No entendí para nada como rescatar el resultado del escaneo del código QR con el @capacitor-mlkit/barcode-scanning

  /*async scan(): Promise<void> {
    const granted = await this.requestPermissions();
    if (!granted) {
      this.presentAlert();
      return;
    }
    const { barcodes } = await BarcodeScanner.scan({
      formats: [BarcodeFormat.QrCode],
      

    });
    this.barcodes.push(...barcodes);
    console.log('Barcodes:', this.barcodes);
  }*/

  sendEmail(){
    const subject = encodeURIComponent('Registro de Código QR');
    const body = encodeURIComponent(`Información obtenida del código QR:\n\n${this.scanResult}`);
    const mailtoLink = `mailto:${this.correoProfesor}?subject=${subject}&body=${body}`;

    window.location.href = mailtoLink;
  }

  async requestPermissions(): Promise<boolean> {
    const { camera } = await BarcodeScanner.requestPermissions();
    return camera === 'granted' || camera === 'limited';
  }
  async presentAlert(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Permission denied',
      message: 'Please grant camera permission to use the barcode scanner.',
      buttons: ['OK'],
    });
    await alert.present();
  }

  async starScan(){
    const modal = await this.modalController.create({
      component: BarcodeScanningModalComponent,
      cssClass: 'barcode-scanning-modal',
      showBackdrop: false,
      componentProps: {
        formats: [],
        LensFacing: LensFacing.Back,
      },
    });
    await modal.present();

    const { data } = await modal.onWillDismiss();
    if(data){

      this.scanResult = data?.barcode?.displayValue;
    }
  }
  /*async startScan(){
    
    if (this.isStudent){
      try{
        const result = await CapacitorBarcodeScanner.scanBarcode({ 
          hint: 0 ,
          
          
        });
        
        const scanTime = new Date();
        
        return result.ScanResult;
      
      }catch (error: any){
        console.error('Error during login:', error);
        
        this.presentToast('Error inesperado')
        return null;
      }
    }else{
      this.presentToast('No hay sesión de estudiante');
      return null;
    }
  }*/

  async generateQRCode() {
    if (this.isProfessor) {
      const generationTime = new Date();
      this.qrGenerationTime = generationTime;
      this.valueToEncode = `${this.userService.getEmail()}|${this.qrGenerationTime.toISOString()}`; 
      const data = await this.supabaseService.getUserDetailsByEmail(this.userService.getEmail()||'');
      console.log(data);
      const id_profesor = data.id;
      this.supabaseService.saveValueQr(this.valueToEncode, id_profesor);    
      return this.valueToEncode;
    } else {
      this.presentToast('No hay sesión de profesor');
      return this.valueToEncode;
    }
  }

  async checkQrValidity(scanTime: Date) {
    if (this.qrGenerationTime) {
      const timeDiff = (scanTime.getTime() - this.qrGenerationTime.getTime()) / 1000 / 60; 
      if (timeDiff > 30) {
        this.presentToast("El codigo Qr expiró");
        return false;
      }
      this.presentToast("Asistencia registrada");
      return true;
    }
    this.presentToast("No existe Qr generado");
    return false;
  }

  async presentToast(message: string) {
    const toast = await this.toastCtrl.create({
      message: message,
      duration: 2000,
      position: 'bottom',
    });
    toast.present();
  }
}
