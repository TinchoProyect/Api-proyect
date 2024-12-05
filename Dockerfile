# Usa la imagen oficial de Node.js 18 como base
FROM node:18

# Instalar las dependencias necesarias para ODBC y SQL Server
RUN apt-get update && apt-get install -y \
    unixodbc-dev \
    curl \
    build-essential \
    apt-transport-https \
    ca-certificates

# Agregar Microsoft ODBC Driver para SQL Server
RUN curl https://packages.microsoft.com/keys/microsoft.asc | apt-key add - && \
    curl https://packages.microsoft.com/config/ubuntu/20.04/prod.list > /etc/apt/sources.list.d/mssql-release.list && \
    apt-get update && \
    ACCEPT_EULA=Y apt-get install -y msodbcsql17

# Establecer el directorio de trabajo en el contenedor
WORKDIR /app

# Copiar los archivos de package.json y package-lock.json al contenedor
COPY package*.json ./

# Instalar las dependencias de la API
RUN npm install

# Copiar todo el código de la API al contenedor
COPY . .

# Exponer el puerto para Cloud Run (puerto 8080)
EXPOSE 8080

# Asegurarse de que la aplicación use el puerto proporcionado por la plataforma
ENV PORT=8080

# Comando para iniciar la API
CMD ["node", "index.js"]



