import LegalPageLayout, { LegalSection } from './LegalPageLayout'

export default function TermsPage() {
  return (
    <LegalPageLayout title="Términos y condiciones" lastUpdated="2 de agosto de 2026">
      <LegalSection title="1. Introducción">
        <p>
          Bienvenido a Balenzishop. Al acceder, registrarte o realizar una compra en nuestro sitio web,
          aceptas estos términos y condiciones. Si no estás de acuerdo con alguna parte de este documento,
          te pedimos no utilizar nuestros servicios.
        </p>
        <p>
          Estos términos regulan el uso del sitio, la creación de cuenta, la compra de productos,
          los envíos, las devoluciones y demás servicios ofrecidos por Balenzishop.
        </p>
      </LegalSection>

      <LegalSection title="2. Identificación del titular">
        <p>
          El sitio web es operado por Balenzishop, dedicado a la comercialización de fragancias y
          productos relacionados en el Perú. Para consultas puedes contactarnos por WhatsApp o por
          los canales indicados en el pie de página del sitio.
        </p>
      </LegalSection>

      <LegalSection title="3. Uso del sitio">
        <p>
          Te comprometes a utilizar el sitio de forma lícita, sin intentar afectar su funcionamiento,
          acceder sin autorización a sistemas, publicar información falsa o usarlo con fines fraudulentos.
        </p>
        <p>
          Nos reservamos el derecho de suspender cuentas o pedidos cuando detectemos uso indebido,
          datos incorrectos, abuso de promociones o conducta que perjudique a la tienda o a otros clientes.
        </p>
      </LegalSection>

      <LegalSection title="4. Registro y cuenta">
        <p>
          Para comprar o gestionar pedidos debes registrarte con información veraz y actualizada.
          Eres responsable de mantener la confidencialidad de tu acceso y de las actividades
          realizadas desde tu cuenta.
        </p>
        <p>
          La información personal que nos proporciones será tratada conforme a nuestra Política de
          privacidad disponible en el sitio.
        </p>
      </LegalSection>

      <LegalSection title="5. Productos, precios y disponibilidad">
        <p>
          Las imágenes, descripciones y precios publicados tienen carácter informativo. Procuramos
          mantener la información actualizada, pero pueden existir variaciones menores en empaque,
          presentación o disponibilidad de stock.
        </p>
        <p>
          Los precios se muestran en soles peruanos (PEN) e incluyen los impuestos aplicables,
          salvo que se indique lo contrario. Nos reservamos el derecho de corregir errores de
          precio antes de confirmar un pedido.
        </p>
        <p>
          Los decants y presentaciones especiales solo estarán disponibles cuando exista stock
          suficiente para su preparación y venta.
        </p>
      </LegalSection>

      <LegalSection title="6. Pedidos, reservas y pagos">
        <p>
          Al confirmar un pedido o reserva, declaras tu intención de compra conforme a los productos,
          cantidades, precios y condiciones mostradas. La confirmación puede estar sujeta a verificación
          de stock, datos de entrega y validación del comprobante de pago.
        </p>
        <p>
          Los métodos de pago disponibles se informan durante el proceso de compra. El pedido se
          considerará en proceso una vez validado el pago o cumplidas las condiciones acordadas
          para reservas.
        </p>
      </LegalSection>

      <LegalSection title="7. Envíos y entregas">
        <p>
          Realizamos envíos en Lima Metropolitana y a nivel nacional según las modalidades
          habilitadas en el checkout. Los plazos estimados son referenciales y pueden variar por
          ubicación, disponibilidad logística o causas ajenas a Balenzishop.
        </p>
        <p>
          Es tu responsabilidad proporcionar una dirección completa y datos de contacto válidos.
          Si la entrega no puede concretarse por información incorrecta o ausencia del destinatario,
          podrían aplicarse costos adicionales o reprogramación.
        </p>
      </LegalSection>

      <LegalSection title="8. Cambios, devoluciones y garantías">
        <p>
          Por tratarse de productos de perfumería, las devoluciones o cambios solo proceden cuando
          el producto presente defectos de fábrica, daño comprobable durante el envío o error
          evidente en el pedido entregado.
        </p>
        <p>
          Debes comunicarte con nosotros dentro de un plazo razonable desde la recepción,
          aportando evidencia del inconveniente. Evaluaremos cada caso conforme a nuestras
          políticas internas y a la normativa aplicable en el Perú.
        </p>
      </LegalSection>

      <LegalSection title="9. Propiedad intelectual">
        <p>
          El contenido del sitio —incluyendo textos, imágenes, logotipos, diseño y código—
          pertenece a Balenzishop o a sus respectivos titulares y está protegido por la legislación
          vigente. No está permitida su reproducción sin autorización previa.
        </p>
      </LegalSection>

      <LegalSection title="10. Limitación de responsabilidad">
        <p>
          Balenzishop no será responsable por interrupciones temporales del servicio, fallas de
          terceros proveedores, retrasos logísticos fuera de nuestro control razonable o daños
          indirectos derivados del uso del sitio.
        </p>
        <p>
          En la medida permitida por la ley, nuestra responsabilidad frente a un pedido se limitará
          al monto efectivamente pagado por dicho pedido.
        </p>
      </LegalSection>

      <LegalSection title="11. Modificaciones">
        <p>
          Podemos actualizar estos términos en cualquier momento. La versión vigente estará
          publicada en esta página con la fecha de última actualización. El uso continuado del
          sitio después de los cambios implica tu aceptación de los nuevos términos.
        </p>
      </LegalSection>

      <LegalSection title="12. Ley aplicable y jurisdicción">
        <p>
          Estos términos se rigen por las leyes de la República del Perú. Cualquier controversia
          será sometida a los tribunales competentes de Lima, salvo disposición legal imperativa
          en contrario.
        </p>
      </LegalSection>

      <LegalSection title="13. Contacto">
        <p>
          Si tienes dudas sobre estos términos, puedes escribirnos por WhatsApp o contactarnos
          mediante los medios publicados en el footer de nuestro sitio web.
        </p>
      </LegalSection>
    </LegalPageLayout>
  )
}
