module.exports=(sequalize, Datatypes)=>{
    const SigIn = sequalize.define(" SignIn", {
        cnpj:{
            type: DataTypes.INTEGER, 
            allowNull: false,
        },
        email:{
            type: DataTypes.STRING,
            allowNull: false,
        },
        passsword:{
            type: DataTypes.STRING,
            allowNull: false,
        },
    });
    return SigIn;
};