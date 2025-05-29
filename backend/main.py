from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv
import google.generativeai as genai

# === Configuración del entorno y Flask ===
app = Flask(__name__)
CORS(app)
load_dotenv()

# Verificar API Key
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise Exception("❌ La clave API de Gemini no está configurada.")
genai.configure(api_key=api_key)
model = genai.GenerativeModel("gemini-2.5-pro-preview-05-06")

# === Ruta principal ===
@app.route("/procesar", methods=["POST"])
def procesar():
    archivos = request.files

    if not archivos:
        return jsonify({"error": "❌ No se recibieron archivos PDF"}), 400

    documentos = []
    nombres_archivos = []

    for clave in archivos:
        archivo = archivos[clave]
        if archivo.filename.endswith(".pdf"):
            documentos.append({
                "mime_type": "application/pdf",
                "data": archivo.read()
            })
            nombres_archivos.append({
                "nombre": archivo.filename,
                "tipo": archivo.mimetype
            })

    if not documentos:
        return jsonify({"error": "❌ No se procesó ningún archivo válido"}), 400

    # Prompt experto completo
    prompt = f"""
    Eres un experto en aduanas mexicanas y análisis de documentos PDF. Extrae únicamente los puntos del 2 al 18.

    Para los puntos del 2 al 14 se utilizan todos los documentos PDF excepto la constancia de situación fiscal. Principalmente el anexo 22 y los otros documentos.

    2. Tipo de operación: Si el origen es México el tipo de operación es exportación, si el origen es extranjero el tipo de operación es importación.
    3. Clave del pedimento: Se obtiene comparando los PDFs recibidos y buscando la clave de pedimento en el apéndice 2 del anexo 22. Páginas 38-54.
    4. Régimen aduanero: Debe coincidir con la clave del pedimento y se consulta en el apéndice 16 (pág. 144).
    5. Destino Origen: Clave del destino de la mercancía en importación. N/A si no aplica.
    6. Tipo de cambio: Puedes obtenerlo del Diario Oficial de la Federación https://dof.gob.mx/#gsc.tab=0
    7. Peso bruto: 10 kg.
    8. Aduana E/S: Según el tipo de operación y el apéndice 1 (págs 34-38).
    9. Clave y descripción del medio de transporte: Anexo 22 apéndice 3, páginas 54-55.
    10. Medio de transporte arribo: No aplica.
    11. Medio de transporte salida: No aplica.
    12. Valor en dólares de la mercancía: Dividir el valor aduanal entre el tipo de cambio.
    13. Valor aduana: 10,000 pesos MXN.
    14. Precio pagado/Valor comercial: 8,000 pesos MXN.

    Para los puntos del 15 al 18 se utiliza el documento de constancia de situación fiscal:

    15. RFC del importador o exportador dependiendo del tipo de operación.
    16. CURP del importador o exportador.
    17. Nombre o razón social.
    18. Domicilio fiscal del importador o exportador.

    Devuelve el resultado en formato JSON limpio, sin explicaciones ni texto adicional. Usa la siguiente estructura:

    {{
        "tipo_operacion": "",
        "clave_pedimento": "",
        "regimen_aduanero": "",
        "destino_origen": "",
        "tipo_cambio": "",
        "peso_bruto": "",
        "aduana_entrada_salida": "",
        "medio_transporte": "",
        "medio_transporte_arribo": "",
        "medio_transporte_salida": "",
        "valor_dolares": "",
        "valor_aduana_mxn": "",
        "valor_comercial_mxn": "",
        "rfc": "",
        "curp": "",
        "razon_social": "",
        "domicilio_fiscal": ""
    }}

    Archivos a procesar: {', '.join([a['nombre'] for a in nombres_archivos])}.
    """

    try:
        contenido = [prompt] + documentos
        respuesta = model.generate_content(contenido)

        # Guardar log
        with open("gemini_response.log", "a") as log_file:
            log_file.write(f"Archivos procesados: {nombres_archivos}\n")
            log_file.write(f"Respuesta: {respuesta.text}\n\n")

        return jsonify({
            "resultado": respuesta.text,
            "archivos_recibidos": nombres_archivos
        }), 200, {"Content-Type": "application/json"}

    except Exception as e:
        return jsonify({"error": f"❌ Error al procesar con Gemini: {str(e)}"}), 500

# === Ejecutar servidor ===
if __name__ == "__main__":
    app.run(debug=True, port=5000)
