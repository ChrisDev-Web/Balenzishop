import LegalPageLayout, { LegalSection } from './LegalPageLayout'

export default function PrivacyPage() {
  return (
    <LegalPageLayout title="Política de privacidad y protección de datos" lastUpdated="2 de agosto de 2026">
      <LegalSection title="1. Compromiso con tu privacidad">
        <p>
          En Balenzishop valoramos la confianza que depositas en nosotros. Esta política explica
          qué datos personales recopilamos, para qué los usamos, cómo los protegemos y cuáles son
          tus derechos conforme a la Ley N.° 29733, Ley de Protección de Datos Personales del Perú,
          y su reglamento.
        </p>
        <p>
          Al registrarte, comprar o interactuar con nuestro sitio, declaras haber leído y aceptado
          el tratamiento de tus datos personales en los términos descritos aquí.
        </p>
      </LegalSection>

      <LegalSection title="2. Responsable del tratamiento">
        <p>
          El responsable del tratamiento de tus datos personales es Balenzishop, con domicilio
          operativo en Lima, Perú. Para ejercer tus derechos o realizar consultas sobre privacidad,
          puedes contactarnos por WhatsApp o por los canales indicados en el footer del sitio.
        </p>
      </LegalSection>

      <LegalSection title="3. Datos que recopilamos">
        <p>Podemos recopilar, entre otros, los siguientes datos:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Nombres, apellidos y documento de identidad.</li>
          <li>Correo electrónico, número de teléfono y WhatsApp.</li>
          <li>Direcciones de entrega, referencias y datos de ubicación.</li>
          <li>Historial de pedidos, productos adquiridos y preferencias de compra.</li>
          <li>Comprobantes de pago, método de pago seleccionado y datos de facturación cuando aplique.</li>
          <li>Datos técnicos de navegación: dirección IP, tipo de dispositivo, navegador y cookies.</li>
        </ul>
        <p>
          Solo solicitamos la información necesaria para gestionar tu cuenta, procesar pedidos,
          coordinar entregas y brindarte atención al cliente.
        </p>
      </LegalSection>

      <LegalSection title="4. Finalidad del tratamiento">
        <p>Utilizamos tus datos personales para:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Crear y administrar tu cuenta de cliente.</li>
          <li>Procesar pedidos, reservas, pagos y facturación.</li>
          <li>Coordinar envíos, entregas y seguimiento logístico.</li>
          <li>Atender consultas, reclamos, devoluciones y soporte postventa.</li>
          <li>Enviarte comunicaciones relacionadas con tu compra o el estado de tu pedido.</li>
          <li>Prevenir fraudes, proteger la seguridad del sitio y cumplir obligaciones legales.</li>
          <li>Mejorar nuestros servicios, experiencia de compra y funcionamiento de la plataforma.</li>
        </ul>
        <p>
          Solo enviaremos comunicaciones promocionales si has dado tu consentimiento o si la ley
          lo permite de forma expresa.
        </p>
      </LegalSection>

      <LegalSection title="5. Base legal del tratamiento">
        <p>
          Tratamos tus datos con base en tu consentimiento, la ejecución del contrato de compraventa,
          el cumplimiento de obligaciones legales y, cuando corresponda, nuestro interés legítimo
          de garantizar la seguridad del servicio y mejorar la experiencia del usuario.
        </p>
      </LegalSection>

      <LegalSection title="6. Conservación de los datos">
        <p>
          Conservaremos tus datos personales mientras mantengas una cuenta activa, exista una
          relación comercial pendiente o sea necesario para cumplir obligaciones legales,
          contables o de defensa de reclamaciones.
        </p>
        <p>
          Una vez cumplidas esas finalidades, eliminaremos o anonimizaremos la información,
          salvo que debamos conservarla por mandato legal.
        </p>
      </LegalSection>

      <LegalSection title="7. Compartición con terceros">
        <p>
          No vendemos ni alquilamos tus datos personales. Podemos compartirlos únicamente con
          terceros que nos ayudan a operar el negocio, tales como:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Proveedores de mensajería, courier y servicios de entrega.</li>
          <li>Plataformas de pago, bancos o procesadores financieros.</li>
          <li>Proveedores tecnológicos de hosting, almacenamiento y soporte del sitio web.</li>
        </ul>
        <p>
          Estos terceros solo acceden a la información estrictamente necesaria para prestar
          su servicio y deben mantener medidas de confidencialidad y seguridad adecuadas.
        </p>
      </LegalSection>

      <LegalSection title="8. Protección y seguridad">
        <p>
          Implementamos medidas técnicas, administrativas y organizativas razonables para
          proteger tus datos personales contra acceso no autorizado, pérdida, alteración o
          divulgación indebida.
        </p>
        <p>
          Aunque adoptamos buenas prácticas de seguridad, ningún sistema en internet es
          completamente infalible. Te recomendamos mantener la confidencialidad de tus
          credenciales de acceso.
        </p>
      </LegalSection>

      <LegalSection title="9. Tus derechos">
        <p>
          Conforme a la normativa peruana, puedes ejercer los siguientes derechos sobre
          tus datos personales:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li><strong>Acceso:</strong> conocer qué datos tratamos sobre ti.</li>
          <li><strong>Rectificación:</strong> corregir datos inexactos o incompletos.</li>
          <li><strong>Cancelación:</strong> solicitar la eliminación cuando ya no sean necesarios.</li>
          <li><strong>Oposición:</strong> oponerte a ciertos tratamientos cuando la ley lo permita.</li>
          <li><strong>Información:</strong> conocer las finalidades y destinatarios del tratamiento.</li>
        </ul>
        <p>
          Para ejercer estos derechos, escríbenos por WhatsApp o por los medios de contacto
          publicados en el sitio, indicando tu nombre completo, documento de identidad y
          el derecho que deseas ejercer.
        </p>
      </LegalSection>

      <LegalSection title="10. Cookies y tecnologías similares">
        <p>
          Utilizamos cookies y tecnologías similares para recordar preferencias, mantener
          tu sesión activa, analizar el uso del sitio y mejorar el rendimiento de la plataforma.
        </p>
        <p>
          Puedes configurar tu navegador para rechazar cookies, aunque algunas funciones
          del sitio podrían dejar de estar disponibles.
        </p>
      </LegalSection>

      <LegalSection title="11. Menores de edad">
        <p>
          Nuestros servicios están dirigidos a personas mayores de edad. No recopilamos
          intencionalmente datos de menores de 18 años. Si detectamos información de un
          menor sin consentimiento de sus padres o tutores, procederemos a eliminarla.
        </p>
      </LegalSection>

      <LegalSection title="12. Transferencias y almacenamiento">
        <p>
          Tus datos pueden almacenarse en servidores ubicados dentro o fuera del Perú,
          siempre bajo estándares de seguridad compatibles con la normativa aplicable
          de protección de datos personales.
        </p>
      </LegalSection>

      <LegalSection title="13. Cambios a esta política">
        <p>
          Podemos actualizar esta política para reflejar cambios legales, tecnológicos
          o en nuestros servicios. Publicaremos la versión vigente en esta página e
          indicaremos la fecha de la última actualización.
        </p>
      </LegalSection>

      <LegalSection title="14. Contacto">
        <p>
          Si tienes preguntas sobre el tratamiento de tus datos personales o deseas
          ejercer tus derechos, contáctanos por WhatsApp o mediante los canales
          disponibles en el footer de Balenzishop.
        </p>
      </LegalSection>
    </LegalPageLayout>
  )
}
