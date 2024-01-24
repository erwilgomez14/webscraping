import puppeteer from 'puppeteer';
import pkg from 'pg';
const { Pool } = pkg;

async function openWebPage() {

    // Conxion a la base de datos PostgreSQL

    const pool = new Pool({
        user: 'admindba', //nombre de usuario
        host: '172.30.8.92', //host
        database: 'meru_prueba_script', // nombre de la base de datos
        password: 'Hidrobolivar2021', // contrase;a
        port: 5432, // puerto 
    });

    const browser = await puppeteer.launch({
        headless: 'new', // Cambiado a 'false' para ver el navegador durante la ejecución
        // slowMo: 500, // milisegundos
    });

    try {
        await pool.connect(); // haciendo la conexion a la base de datos
        console.log('Conexión a la base de datos establecida correctamente.');

        const page = await browser.newPage(); // abrir el navegador

        await page.goto('https://www.bcv.org.ve/', { waitUntil: 'domcontentloaded' }); // ir a la pagina deseada

        await page.waitForSelector('#dolar'); // buscar este id con el selector 

        const valor = await page.$eval('#dolar .centrado strong', element => element.textContent.trim()); // tomamos el valor necesario de la pagina web 

        // Reemplazar la coma por un punto y convertir a float
        const valorFloat = parseFloat(valor.replace(',', '.'));

        console.log('Valor como float:', valorFloat);
        console.log('Valor con dos decimales:', valorFloat.toFixed(2));
        console.log(typeof valorFloat); // Esto debería imprimir 'number'

        const selectQuery = "SELECT * FROM com_ofertaproveedor WHERE tip_mon = '2' and ano_pro = 2023"; // realizamos la consulta para saber que ordenes tiene tipo de moneda DOLAR

        const result = await pool.query(selectQuery); // corremos la consulta en la BD

        // Recorrer los resultados de la consulta
        for (const row of result.rows) {

            let ano_pro = row.ano_pro;
            let nro_sol = row.nro_sol;
            let nro_ofe = row.nro_ofe;


            let monto_bruto = parseFloat(row.monto_bruto).toFixed(2) * valorFloat.toFixed(2);
            let monto_iva = parseFloat(row.monto_iva).toFixed(2) * valorFloat.toFixed(2);
            let monto_total = parseFloat(row.monto_total).toFixed(2) * valorFloat.toFixed(2);

            console.log('Ano_pro:', ano_pro, ' tipo: ', typeof (ano_pro));
            console.log('Numero de contizacion:', nro_sol, ' tipo: ', typeof (nro_sol));
            console.log('Monto bruto:', monto_bruto, ' tipo: ', typeof (monto_bruto));
            console.log('Monto iva:', monto_iva, ' tipo: ', typeof (monto_iva));
            console.log('Monto total:', monto_total, ' tipo: ', typeof (monto_total));
            console.log('Numero de oferta:', nro_ofe, ' tipo: ', typeof (nro_ofe));


            const upateordenes = "SELECT * FROM com_encordencompra WHERE num_cot = " + nro_sol + " and ano_pro = 2023";

            const orden = await pool.query(upateordenes);

            let xnro_orden;

            for (const row of orden.rows) {
                xnro_orden = row.xnro_ord;
            }

            // console.log(xnro_orden);

            const arrayResultante = xnro_orden.split('-');

            console.log('Array resultante:', arrayResultante[0]);

            const updateQuery = `
                                    UPDATE com_encordencompra
                                    SET mto_ord = ${monto_total}, mto_siniva = ${monto_bruto}, total_iva = ${monto_iva}
                                    WHERE num_cot = ${nro_sol} AND ano_pro = 2023`;




            // Ejecutar la consulta UPDATE en tu base de datos
            const resultadoordenes = await pool.query(updateQuery);

            console.log(resultadoordenes);

            const upateordenesdet = "SELECT * FROM com_detgastosordencompra WHERE nro_ord  = " + arrayResultante[1] + " and ano_pro = 2023 and grupo = '" + arrayResultante[0] + "'";

            console.log(upateordenesdet);

            const resultupateordenesdet = await pool.query(upateordenesdet);

            //console.log(resultupateordenesdet.rows);

            const ofertadetquery = "SELECT * FROM com_detofertaspro WHERE nro_ofe  = " + nro_ofe + " and ano_pro = 2023 and grupo = '" + arrayResultante[0] + "'";

            const resultofertadetquery = await pool.query(ofertadetquery);

            console.log(resultofertadetquery.rows);


            for (const row of resultofertadetquery.rows) {
                let cod_prod = row.cod_prod;


                let pre_uni = parseFloat(row.pre_uni).toFixed(2) * valorFloat.toFixed(2);

                let mon_pu = parseFloat(row.mon_pu).toFixed(2) * valorFloat.toFixed(2);
                let mon_iva = parseFloat(row.mon_iva) * valorFloat.toFixed(2);
                let monto_total = parseFloat(row.monto_total).toFixed(2) * valorFloat.toFixed(2);


                console.log('Precio unitario:', pre_uni, ' tipo: ', typeof (pre_uni));
                console.log('Monto bruto:', mon_pu, ' tipo: ', typeof (mon_pu));
                console.log('Monto iva:', mon_iva, ' tipo: ', typeof (mon_iva));
                console.log('Monto total:', monto_total, ' tipo: ', typeof (monto_total));

                //const select = "SELECT * FROM com_detordencompra WHERE ano_pro = 2023 AND grupo = '" + arrayResultante[0] + "' AND nro_sol = 206" ;
                const select = "SELECT * FROM com_detordencompra WHERE ano_pro = 2023 AND grupo = '" + arrayResultante[0] + "' AND cod_prod = '" + cod_prod + "' AND nro_sol = " + nro_sol;

                const resultoselect = await pool.query(select);

                console.log(resultoselect.rows);


                if (resultoselect.rowCount !== 0) {

                    const updateQuery = "UPDATE com_detordencompra SET p_unida = " + pre_uni + ", tot_bol = " + mon_pu + ",  mon_iva = " + mon_iva + ", t_unida = " +
                        monto_total + ", monto_saldo = " + mon_pu + " WHERE ano_pro = 2023 AND grupo = '" + arrayResultante[0] + "' AND cod_prod = '" + cod_prod + "' AND nro_sol = " + nro_sol;

                    console.log(updateQuery);


                    const resulupdateQuery = await pool.query(updateQuery);

                    console.log(resulupdateQuery.rows);

                    for (const row of resultoselect.rows) {
                        let cod_com = row.cod_com;
                        let xnro_ord = row.xnro_ord;


                        console.log('Partida :', cod_com);
                        console.log('Numero de Orden :', xnro_ord);

                        // const query = "UPDATE com_detgastosordencompra SET mto_tra = "+  +"WHERE cod_com ='"+ cod_com +"' AND ano_pro = 2023 AND xnro_ord = '"+xnro_ord+"'";

                        const query = "UPDATE com_detgastosordencompra SET mto_tra = " + mon_pu + " WHERE cod_com ='" + cod_com + "' AND ano_pro = 2023 AND xnro_ord = '" + xnro_ord + "'";

                        const resulquery = await pool.query(query);

                        console.log(resulquery.rows);
                    }

                }

                

                // const updateQuery = `
                // UPDATE com_detordencompra
                // SET p_unida = ${pre_uni}, tot_bol = ${mon_pu}, mon_iva = ${mon_iva}, t_unida = ${monto_total}, monto_saldo = ${mon_pu}
                // WHERE grupo = '${arrayResultante[0]}' AND ano_pro = 2023 AND cod_prod = '${cod_prod}' AND nro_sol = ${nro_sol}`;






            }


            break;
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
        await browser.close();
        console.log('Conexión a la base de datos y navegador cerrados.');
    }
}

openWebPage();
