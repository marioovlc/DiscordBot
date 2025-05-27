const { Client, GatewayIntentBits, Events, SlashCommandBuilder, REST, Routes, PermissionFlagsBits } = require('discord.js');
const { token } = require('./config.json');

const rolQuitarId = '1345474611659276352';
const rolDarId = '1307005181686452225';
const rolRequeridoId = '1371435440950874202';
const guildId = '1307005181593915402'; // Tu servidor

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

// Definir el comando slash con permisos
const rangoCommand = new SlashCommandBuilder()
  .setName('rango')
  .setDescription('Cambiar el rango de un usuario')
  .addUserOption(option =>
    option.setName('usuario')
      .setDescription('El usuario al que cambiar el rango')
      .setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles); // Requiere Manage Roles

// Registrar comandos cuando el bot esté listo
client.once(Events.ClientReady, async c => {
  console.log(`Bot listo como ${c.user.tag}`);
  console.log(`ID del bot: ${c.user.id}`);
  
  // Verificar que el bot esté en el servidor correcto
  const guild = await client.guilds.fetch(guildId).catch(() => null);
  if (!guild) {
    console.error(`❌ El bot NO está en el servidor ${guildId}`);
    return;
  }
  
  console.log(`✅ Bot conectado al servidor: ${guild.name}`);
  
  // Verificar roles en el servidor
  console.log('\n=== VERIFICANDO ROLES ===');
  const rolDar = guild.roles.cache.get(rolDarId);
  const rolQuitar = guild.roles.cache.get(rolQuitarId);
  const rolRequerido = guild.roles.cache.get(rolRequeridoId);
  
  console.log(`Rol a dar (${rolDarId}): ${rolDar ? `✅ ${rolDar.name}` : '❌ NO ENCONTRADO'}`);
  console.log(`Rol a quitar (${rolQuitarId}): ${rolQuitar ? `✅ ${rolQuitar.name}` : '❌ NO ENCONTRADO'}`);
  console.log(`Rol requerido (${rolRequeridoId}): ${rolRequerido ? `✅ ${rolRequerido.name}` : '❌ NO ENCONTRADO'}`);
  
  // Verificar permisos del bot
  const botMember = await guild.members.fetch(c.user.id).catch(() => null);
  if (botMember) {
    const hasManageRoles = botMember.permissions.has(PermissionFlagsBits.ManageRoles);
    console.log(`Bot tiene Manage Roles: ${hasManageRoles ? '✅ SÍ' : '❌ NO'}`);
    
    // Verificar jerarquía
    const botHighestRole = botMember.roles.highest;
    console.log(`Rol más alto del bot: ${botHighestRole.name} (posición: ${botHighestRole.position})`);
    
    if (rolDar) {
      console.log(`Puede asignar rol "${rolDar.name}": ${botHighestRole.position > rolDar.position ? '✅ SÍ' : '❌ NO'}`);
    }
    if (rolQuitar) {
      console.log(`Puede remover rol "${rolQuitar.name}": ${botHighestRole.position > rolQuitar.position ? '✅ SÍ' : '❌ NO'}`);
    }
  }
  
  // Registrar comandos slash
  const rest = new REST({ version: '10' }).setToken(token);
  
  try {
    console.log('\n=== REGISTRANDO COMANDOS ===');
    
    await rest.put(
      Routes.applicationGuildCommands(c.user.id, guildId),
      { body: [rangoCommand.toJSON()] }
    );
    
    console.log('✅ Comandos slash registrados exitosamente!');
    console.log('\n🎯 El comando /rango debería aparecer ahora en Discord');
    console.log('💡 Si no aparece, espera unos minutos o reinicia Discord');
    
  } catch (error) {
    console.error('❌ Error al registrar comandos:', error);
  }
});

client.on(Events.InteractionCreate, async interaction => {
  console.log(`\n=== INTERACCIÓN RECIBIDA ===`);
  console.log(`Tipo: ${interaction.type}`);
  console.log(`Usuario: ${interaction.user.tag}`);
  console.log(`Servidor: ${interaction.guild ? interaction.guild.name : 'DM'}`);
  
  if (!interaction.isChatInputCommand()) {
    console.log('No es un comando slash, ignorando...');
    return;
  }
  
  console.log(`Comando: ${interaction.commandName}`);

  if (interaction.commandName === 'rango') {
    console.log('🎯 Procesando comando /rango');
    
    // Verificar servidor
    if (!interaction.guild || interaction.guild.id !== guildId) {
      console.log('❌ Comando ejecutado en servidor incorrecto');
      return interaction.reply({
        content: '❌ Este comando solo puede usarse en el servidor autorizado.',
        flags: 64
      });
    }

    await interaction.deferReply({ flags: 64 });
    console.log('✅ Respuesta diferida');

    let member = interaction.member;

    // Obtener miembro si es necesario
    if (!member || !member.roles || !member.roles.cache) {
      console.log('Obteniendo información del usuario...');
      try {
        member = await interaction.guild.members.fetch(interaction.user.id);
      } catch (error) {
        console.error('Error al obtener miembro:', error);
        return interaction.editReply('❌ No pude verificar tus roles. Intenta de nuevo.');
      }
    }

    // Verificar permisos
    console.log(`Usuario tiene rol requerido: ${member.roles.cache.has(rolRequeridoId) ? '✅ SÍ' : '❌ NO'}`);
    if (!member.roles.cache.has(rolRequeridoId)) {
      return interaction.editReply('❌ No tienes permisos para usar este comando.');
    }

    const miembro = interaction.options.getMember('usuario');
    console.log(`Usuario objetivo: ${miembro ? miembro.user.tag : 'NO ENCONTRADO'}`);

    if (!miembro) {
      return interaction.editReply('❌ No encontré al usuario indicado en este servidor.');
    }

    try {
      const rolDar = interaction.guild.roles.cache.get(rolDarId);
      const rolQuitar = interaction.guild.roles.cache.get(rolQuitarId);

      if (!rolDar) {
        return interaction.editReply('❌ El rol a asignar no existe en este servidor.');
      }

      console.log(`Intentando cambiar roles para ${miembro.user.tag}...`);

      // Asignar nuevo rol
      await miembro.roles.add(rolDarId);
      console.log(`✅ Rol "${rolDar.name}" asignado`);

      // Quitar rol anterior si lo tiene
      if (rolQuitar && miembro.roles.cache.has(rolQuitarId)) {
        await miembro.roles.remove(rolQuitarId);
        console.log(`✅ Rol "${rolQuitar.name}" removido`);
      }

      await interaction.editReply(`✅ Se cambió el rango de ${miembro.user.tag} exitosamente.`);
      console.log('🎉 Comando ejecutado exitosamente');
      
    } catch (error) {
      console.error('❌ Error al cambiar roles:', error);
      
      if (error.code === 50013) {
        await interaction.editReply('❌ No tengo permisos suficientes. Mi rol debe estar por encima de los roles que intento modificar.');
      } else if (error.code === 10011) {
        await interaction.editReply('❌ Uno de los roles no existe.');
      } else {
        await interaction.editReply(`❌ Error: ${error.message}`);
      }
    }
  }
});

client.on('error', error => {
  console.error('Error del cliente:', error);
});

client.login(token);