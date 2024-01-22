import puppeteer from 'puppeteer';
import pkg from 'pg';
const { Pool } = pkg;

async function openWebPage() {
    const browser = await puppeteer.launch({
        headless: false,
        slowMo: 500, // milisegundos
    });

    const pool = new Pool({
        user: 'admindba',
        host: '172.30.8.92',
        database: 'meru_prueba_script',
        password: 'Hidrobolivar2021',
        port: 5432, // o el puerto que estés utilizando
    });

    const page = await browser.newPage();

    try {

        await pool.connect();
        console.log('Conexión a la base de datos establecida correctamente.');

        await page.goto('https://www.bcv.org.ve/', { waitUntil: 'domcontentloaded' });

        // Esperar a que el selector '#dolar' esté presente
        await page.waitForSelector('#dolar');

        // Extraer el valor de <strong> 36546544,13790000 </strong> dentro del div con id 'dolar'
        const valor = await page.$eval('#dolar .centrado strong', element => element.textContent.trim());

        // Imprimir el valor en la consola (puedes hacer lo que desees con este valor)
        console.log(valor);

        // Ejemplo de SELECT
        const selectQuery = 'SELECT * FROM adm_tasacambio';
        const result = await pool.query(selectQuery);

        // Mostrar el resultado por consola
        console.log('Resultado del SELECT:', result.rows);

        await browser.close();

    } catch (error) {
        console.error('Error:', error);
    } finally {
        // Cerrar el navegador
        await browser.close();
    }
}

openWebPage();
