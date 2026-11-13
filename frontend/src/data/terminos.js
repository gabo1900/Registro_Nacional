import { MARCA } from './marca';

export const TERMINOS_SECCIONES = [
  {
    id: 'primero',
    titulo: 'PRIMERO.- GENERAL',
    resumen: 'Regulación entre el Usuario y Fanpass, obligatoriedad del consentimiento biométrico expreso.',
    contenido: [
      'Los presentes términos y condiciones regulan la relación entre usted (en adelante el “Usuario”) y Fanpass (en adelante la “ENTIDAD”) y tienen por objeto fijar las condiciones de uso del servicio de acceso (en adelante, el “Servicio”). En concreto, el Servicio se compone de una fase en la que deberá dar su consentimiento para el registro a través de la presente web, dicho registro será consultado al momento de la realización de compras de entradas en aquellos encuentros en que se disponga del uso de Fanpass, proceso en el cual se consultará para corroborar la existencia de prohibiciones de ingreso. Asimismo, también se podrán realizar una o varias verificaciones biométricas en la puerta o puertas de acceso según se determine por la autoridad.',
      'La aceptación de los presentes términos y condiciones se entiende producida cuando el Usuario señala la opción “Acepto” que figura en la aplicación de registro del Servicio en el momento de iniciarla, quedando las condiciones siempre accesibles para el Usuario a través de esta página web. Será necesario marcar, previamente, la casilla en la que se acepta expresamente el uso de los datos biométricos para llevar a cabo el proceso; la falta de este consentimiento no permitirá acceder al servicio.',
      'Para cualquier incidencia, duda, consulta o reclamación relacionada con el Servicio ofrecido, el Usuario puede ponerse en contacto con la ENTIDAD en la dirección de correo electrónico ' + MARCA.correoAyuda + '.'
    ]
  },
  {
    id: 'segundo',
    titulo: 'SEGUNDO.- SOBRE EL SERVICIO',
    resumen: 'Permisos de cámara, validación en compra de entradas y verificación biométrica o cédula en puertas del estadio.',
    contenido: [
      '2.1.- Para que el Servicio pueda funcionar es necesario que el Usuario dé su consentimiento para el tratamiento de sus datos con esta finalidad y complete las distintas etapas del proceso de registro, permitiendo que la aplicación tenga acceso a determinadas funcionalidades (ej. cámara) del dispositivo del Usuario. A través de la pantalla del dispositivo, la aplicación de registro le solicitará los permisos y autorizaciones necesarias, pudiendo el Usuario en cualquier momento modificar dichas autorizaciones y permisos. Esto último podría causar, no obstante, que no pueda llevarse a cabo la verificación de su identidad en el futuro.',
      '2.2.- Una vez completada la fase de registro, el Usuario recibirá un mensaje en su dispositivo con la confirmación de que el proceso se ha realizado correctamente. Al momento de la compra de entradas en un encuentro en que se disponga del uso de Fanpass, para efectos de validar la compra se consultará el registro para determinar si el asistente se encuentra registrado. Asimismo, el sistema permitirá determinar la existencia de prohibiciones de ingreso. Finalmente, para acceder a las instalaciones, según se disponga en la respectiva autorización del encuentro, el ingreso podrá realizarse mediante el control de cédula de identidad y/o mediante control de acceso biométrico. Si se dispusiere del uso de control biométrico al ingreso en alguno de los controles, el Usuario deberá situarse frente a la cámara (en la zona de captura) del terminal de acceso, que tomará la fotografía, la transformará en un vector biométrico (datos biométricos) y lo comparará con el que la Entidad mantiene en sus bases de datos; en caso de que se verifique positivamente a la persona, se permitirá directamente su acceso a las instalaciones. En caso que el sistema biométrico de ingreso presente algún inconveniente o se requiera de mecanismos alternativos de ingreso por razones fundadas, el personal de ingreso podrá validar el ingreso mediante la cédula de identidad.'
    ]
  },
  {
    id: 'tercero',
    titulo: 'TERCERO.- SOBRE EL USUARIO',
    resumen: 'Fases de identificación, evidencias biométricas y procesamiento en dispositivo y servidores autorizados.',
    contenido: [
      '3.1.- De cara a su uso del Servicio, le informamos de las siguientes pautas que deben observarse para que el sistema opere adecuadamente. Para dotar al sistema de mayor precisión y seguridad, el proceso de identificación y autenticación del Usuario se lleva a cabo a través de distintas fases y evidencias. Para poder completar la autenticación y permitirle el acceso, es imprescindible que usted complete el proceso. No obstante, le informamos de que ciertos procesamientos de los datos se realizan mientras el Usuario realiza el proceso, sin esperar a su finalización. Algunas de estas operaciones se realizarán en su dispositivo mientras que otras tendrán lugar en el terminal de acceso o en servidores externos. En estos procesos se le exigirá que muestre un documento de identidad y/o se tome una imagen de su rostro.',
      '3.2.- Para el uso del Servicio, resulta necesario (i) realizar el proceso de registro desde la página web en un dispositivo que cumpla los requisitos mínimos indicados (algunas opciones pueden diferir en función del dispositivo); (ii) realizar el proceso de verificación ante la puerta de acceso.',
      '3.3.- Aparte de las operaciones que el Servicio pueda realizar en el propio terminal en el que se está ejecutando el sistema, en algunos momentos, el Servicio comunica la información recabada a los servidores de la ENTIDAD o de sus proveedores, de forma que pueda procesar los datos. Los tratamientos de datos antes mencionados serán realizados por la ENTIDAD de acuerdo con la Política de Privacidad indicada en los presentes términos y condiciones.'
    ]
  },
  {
    id: 'cuarto',
    titulo: 'CUARTO.- ACCESO AL SERVICIO EN LA FASE DE REGISTRO',
    resumen: 'Acceso durante el flujo de compra, notificación de incidencias y conectividad a Internet.',
    contenido: [
      '4.1.- El acceso del Usuario al registro en la página web se realizará en el mismo proceso de compra que se llevará a cabo en la página web.',
      '4.2.- Ante cualquier incidencia que el Usuario pudiera advertir, deberá ponerlo en conocimiento de la ENTIDAD a la mayor brevedad posible para su cancelación inmediata, ya que hasta ese momento, la ENTIDAD declina cualquier tipo de responsabilidad por los actos y/u operaciones que hayan podido realizarse en el Servicio derivados de una custodia incorrecta del enlace.',
      '4.3.- Para el funcionamiento del Servicio es necesario que el dispositivo bajo el cual opera el mismo realice conexiones a través de Internet a los servidores de la ENTIDAD o de sus proveedores, circunstancia que puede acarrear gastos al Usuario. En ningún caso la ENTIDAD asumirá ningún tipo de coste o responsabilidad por el funcionamiento o cobros que los servicios de conexión a Internet y de posicionamiento que puedan ser necesarios para el funcionamiento del sistema desde el terminal del Usuario en donde se ejecute el mismo, que serán en todo caso a cargo y responsabilidad del Usuario.'
    ]
  },
  {
    id: 'quinto',
    titulo: 'QUINTO.- POLÍTICA DE PROTECCIÓN DE DATOS (LEY N° 19.628 Y LEY N° 19.327)',
    resumen: 'Responsable Fanpass, Vectores Biométricos Cifrados, Almacenamiento en GCP Chile, Derechos ARCO y Contacto DPO.',
    contenido: [
      'La protección de los datos personales de los hinchas es un pilar fundamental en la operación de Fanpass. Conscientes de la sensibilidad de la información tratada, especialmente los datos biométricos, Fanpass se compromete a dar estricto cumplimiento a las disposiciones de la Ley N°19.628 sobre Protección de la Vida Privada y a implementar medidas de seguridad robustas para resguardar la confidencialidad, integridad y disponibilidad de los datos.',
      '5.1. Responsable y Encargados del Tratamiento: El Responsable del Tratamiento de los datos personales recabados a través de Fanpass es Fanpass. La finalidad de Fanpass es contar con un registro único de asistentes al estadio a encuentros profesionales de fútbol, consultado en compras de entradas y verificaciones biométricas en puertas de acceso, así como aplicación efectiva del derecho de admisión (Ley N° 19.327). Encargados incluyen servicios en la nube, tecnologías biométricas de reconocimiento facial, gestión de derechos de acceso y ticketeras.',
      '5.2. Datos Personales Tratados: Fotografías o selfies del rostro (durante enrolamiento y control), Vectores biométricos (datos sensibles según artículo 2.g de la Ley N°19.628 almacenados de manera cifrada), Nombre y apellidos, Documento de identidad (Cédula o Pasaporte, número, nacionalidad, fecha de nacimiento), y Teléfono o correo electrónico.',
      '5.3. Finalidades Específicas del Tratamiento: (1) Captura y Generación de Datos Biométricos; (2) Verificación de Identidad para Acceso; (3) Validación de Documento Identificativo; (4) Detección de Fraude y Prueba de Vida (sin grabación de video); (5) Aplicación del Derecho de Admisión; (6) Identificación para Investigación de Ilícitos y Faltas conforme a la Ley N°19.327. Los datos NO son objeto de comercialización.',
      '5.4. Medidas de Seguridad Implementadas: Cifrado robusto de vectores biométricos, Control de Acceso Lógico de mínimo privilegio, Auditorías periódicas de seguridad, Sistemas IDS/IPS, Gestión de vulnerabilidades, Capacitación del personal, Acuerdos de confidencialidad, Planes de respuesta a incidentes y transmisión segura TLS/SSL.',
      '5.5. Almacenamiento y transferencia de datos: El almacenamiento de los datos se lleva a cabo exclusivamente en los servidores que Google Cloud Platform tiene ubicados en Chile. El procesamiento inicial de verificación de identidad se realiza en pocos segundos en AWS (USA), eliminándose automática y definitivamente cualquier rastro de este entorno externo tras la verificación.',
      '5.6. Plazo de Conservación y Cesión a Terceros: Los datos se conservan mientras se mantenga vigente la habilitación legal (Ley N°19.327). Los datos que no hayan sido utilizados durante un plazo de dos (2) años corridos serán eliminados automáticamente de la plataforma. No se ceden datos a terceros salvo obligación legal. Ante consultas de autoridad competente o clubes bajo protocolo, únicamente se informará la probabilidad de acierto sin entregar la información biométrica ni fotografías.',
      '5.7. Derechos de los Titulares (Derechos ARCO): Conforme al Artículo 12 de la Ley N°19.628, el hincha puede ejercer gratuitamente sus derechos de Acceso, Rectificación, Cancelación (eliminación dentro de 60 días), Oposición, Limitación del Tratamiento y Portabilidad, enviando solicitud con copia de Cédula de Identidad a ' + MARCA.correoDatos + '.',
      '5.8 - 5.10. Gratuidad, Delegado de Protección de Datos (DPO) y Autoridad Competente: El ejercicio de derechos es gratuito. Contacto oficial del DPO de Fanpass: ' + MARCA.correoPrivacidad + '. El titular también tiene derecho a reclamar ante el Consejo para la Transparencia y la futura Agencia de Protección de Datos Personales.'
    ]
  },
  {
    id: 'sexto',
    titulo: 'SEXTO.- VIOLACIÓN DE LAS CONDICIONES DE USO',
    resumen: 'Prohibición de suplantación de identidad, datos de terceros sin consentimiento o ingeniería inversa.',
    contenido: [
      '6.1. Violación por parte del Usuario: Incluye el uso del Servicio para fines distintos a los indicados, incorporación de datos de terceros sin consentimiento, intento de suplantar la identidad de otro usuario, o intentos de descompilación/ingeniería inversa.',
      '6.2. Consecuencias para el Usuario: Suspensión temporal o permanente de la cuenta del Usuario en Fanpass y reclamo de daños y perjuicios sin derecho a indemnización.',
      '6.3. Consecuencias para Clubes o Terceros: El incumplimiento de las obligaciones de reserva y confidencialidad por parte de un club o proveedor será sancionado conforme a la Ley N°19.628.'
    ]
  },
  {
    id: 'septimo',
    titulo: 'SÉPTIMO.- CAMBIOS, SUSPENSIÓN O FINALIZACIÓN DEL SERVICIO',
    resumen: 'Facultad de actualización normativa y suspensión por incumplimiento.',
    contenido: [
      '7.1. Modificación de las Condiciones de Uso: Fanpass podrá modificar los Términos y Condiciones notificando debidamente a los usuarios y condicionando el acceso continuo a su aceptación.',
      '7.2 - 7.3. Suspensión o Revocación: En caso de incumplimiento, Fanpass podrá suspender o revocar el acceso sin aviso previo.'
    ]
  },
  {
    id: 'octavo',
    titulo: 'OCTAVO.- DISPOSICIONES FINALES',
    resumen: 'Idioma castellano, Ley chilena aplicable, Arbitraje CAM Santiago y monitoreo de Ley N° 19.327 y N° 19.628.',
    contenido: [
      '8.1. Idioma: Prevalecerá siempre lo redactado en idioma castellano.',
      '8.2. Ley Aplicable y Jurisdicción: Se rige por la Ley chilena. Toda controversia se someterá a arbitraje administrado conforme al Reglamento Procesal de Arbitraje del Centro de Arbitraje y Mediación (CAM) de la Cámara de Comercio de Santiago (CCS).',
      '8.3. Actualizaciones Normativas: Fanpass monitorea activamente la Ley N°19.327 y la Ley N°19.628 para mantener este manual y el sistema actualizados.'
    ]
  }
];

export const ESPECIFICACION_ARQUITECTURA = [
  {
    titulo: '1. Arquitectura Hexagonal en Java (Quarkus)',
    subtitulo: 'Puertos y Adaptadores con Aislamiento de Dominio Puro',
    puntos: [
      'Núcleo de Dominio Puro: Entidades (Tenant, Usuario, Hincha, Consentimiento, ProhibicionIngreso, HuellaBiometrica) y Value Objects inmutables (RutDocumento, VectorBiometricoRef, NivelConfianza).',
      'Zero-Retention de Imágenes: Las fotografías de rostro y cédula se procesan en memoria hacia el adaptador biométrico y se destruyen inmediatamente tras generar el vector cifrado.',
      'Desacoplamiento de Proveedores: El puerto BiometricProviderPort permite cambiar o actualizar el motor biométrico de la entidad de fútbol sin tocar las reglas de negocio.'
    ]
  },
  {
    titulo: '2. Defensa en Profundidad y Cifrado End-to-End',
    subtitulo: 'Seguridad en Transporte, Aplicación y Base de Datos PostgreSQL',
    puntos: [
      'Cifrado en Reposo AES-256-GCM: Todos los vectores biométricos, tokens de referencia, números de documento y claves públicas de huella se cifran con IV aleatorio de 96 bits antes de guardarse en PostgreSQL.',
      'Blind Index Irreversible (HMAC-SHA256): Búsqueda instantánea O(1) de documentos con prohibición de ingreso (Derecho de Admisión) sin almacenar ni exponer jamás el RUT en texto plano.',
      'Contraseñas Hasheadas (PBKDF2-HMAC-SHA256): 65,536 iteraciones con sal criptográfica de 128 bits por cada usuario; ningún usuario ni administrador puede ver claves de otros.'
    ]
  },
  {
    titulo: '3. Multi-Tenancy Unificado en una Sola Base de Datos',
    subtitulo: 'Aislamiento Lógico Estricto por Estadio / Club / Entidad',
    puntos: [
      'Super Administrador Global: Crea y administra los Tenants (ej. Estadio Municipal, Estadio Nacional, Clubes), define su capacidad de usuarios y módulos contratados.',
      'Administrador de Tenant (Estadio): Administra exclusivamente su propio segmento de datos (sus usuarios, sus operadores de torniquete, sus validaciones de puerta y prohibiciones).',
      'Portal del Hincha: Enrolamiento web con cámara HTML5 (navigator.mediaDevices.getUserMedia), Prueba de Vida activa (Liveness), registro de Huella Digital (WebAuthn FIDO2) y ejercicio de Derechos ARCO.'
    ]
  }
];
