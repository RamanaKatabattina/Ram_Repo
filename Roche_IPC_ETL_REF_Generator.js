/** 
 * CAT : INFA_DV_REF_CAT
 * Version : V5.0
 * Developer: Ramana Katabattina
 * Organization: Analytix Data Services.
 */ 

importPackage(java.lang);
importPackage(java.io);
importPackage(java.util);
importPackage(com.ads.mm.db.util);
importPackage(com.ads.api.util);
importPackage(com.ads.api.beans.common);
importPackage(com.ads.api.beans);

/** Global variables */
var mapping = MAPPING;

/** AMM Util Service Object Creation. */
var vmappingManagerUtil = new MappingManagerUtil(AUTH_TOKEN);


/** Main function */
function execute() {

    var sb = new java.lang.StringBuffer();
    var mappingVo = vmappingManagerUtil.getMapping(mapping.getMappindId());

    /** Creates Informatica .xml header */
    sb.append(CreateHeader());

    /** Creates Informatica .xml Source details */ 
    sb.append(Source());

    /** Creates Informatica .xml Target details */
    sb.append(Target());

    /** Creates Informatica .xml Mapping details */
    sb.append(MappingDetails());

    sb.append("</FOLDER> \n");

    sb.append(SharedTrans());

    sb.append("</REPOSITORY> \n");
    sb.append("</POWERMART> \n");

    return sb;

}

/** Creates Informatica .xml Header creation point */
function CreateHeader(){

    var header = new java.lang.StringBuffer();

    header.append("<?xml version=\"1.0\" encoding=\"Windows-1252\"?> \n");
    header.append("<!DOCTYPE POWERMART SYSTEM \"powrmart.dtd\"> \n");
    header.append("<POWERMART CREATION_DATE=\"03/02/2018 11:12:13\" REPOSITORY_VERSION=\"184.93\"> \n");
    header.append("<REPOSITORY NAME=\""+vRepo+"\" VERSION=\"184\" CODEPAGE=\""+vCodePage+"\" DATABASETYPE=\"Oracle\"> \n");
    header.append("<FOLDER NAME=\""+vSharedFolderName+"\" GROUP=\"\" OWNER=\""+vOwner+"\" SHARED=\"SHARED\" DESCRIPTION=\"\" PERMISSIONS=\"rwx---r--\" UUID=\"471fdd05-824a-4032-92fb-d0bd8e6a98b6\"> \n");

    return header;

}

/** Creates Informatica .xml Source Details creation point */
function Source(){

    var src = new java.lang.StringBuffer();
    var tfrms =  mapping.getTransformations();

    var sourceTable = "";
    var sourceTableName = "";
    var srcSchema = "";

    var sourceColumnName = "";
    var dataType = "";
    var dataLength = "";
    var dataPrecision = "";
    var dataScale = "";

    /** Iterate over the mapping specifications to get the Source Table Name */ 
    for (var i=0;i<tfrms.size();
         i++) 
    {
        if (tfrms.get(i).getInputColumns().size()>0) 
        {

            if (!tfrms.get(i).getInputColumns().get(0).getParentTable().getCompleteName().equals("SYS") && !tfrms.get(i).getInputColumns().get(0).getParentTable().getCompleteName().equals("")) {
                sourceTable = tfrms.get(i).getInputColumns().get(0).getParentTable().getCompleteName();
            }
        }
    }

    sourceTableName = sourceTable.substring(sourceTable.indexOf(".")+1);

    /** If Source Schema exist in Context it will consider that value else default */  
    if(vSourceSchema.trim().equals("")){
        srcSchema="dbo";
    }
    else{
        srcSchema=vSourceSchema;
    }


    src.append("    <SOURCE BUSINESSNAME =\"\" DATABASETYPE =\""+vSourceComponent+"\" DBDNAME =\""+vSourceDB+"\" DESCRIPTION =\"\" NAME =\"" +sourceTableName+ "\" OBJECTVERSION =\"1\" OWNERNAME =\""+srcSchema+"\" VERSIONNUMBER =\"1\"> \n");


    /** Iterate over the mapping specifications to get the Source Columns Details */  
    for (var j=0;j<tfrms.size();
         j++)

        if (tfrms.get(j).getInputColumns().size()>0) {
            if (!tfrms.get(j).getInputColumns().get(0).getParentTable().getCompleteName().equals("SYS")) {

                if (!tfrms.get(j).getInputColumns().get(0).getParentTable().getCompleteName().equals("")) {

                    sourceColumnName = tfrms.get(j).getInputColumns().get(0).getColumnName();
                    dataType = tfrms.get(j).getInputColumns().get(0).getDataType();
                    dataLength = tfrms.get(j).getInputColumns().get(0).getLength();
                    dataPrecision = tfrms.get(j).getInputColumns().get(0).getPrecision();
                    dataScale = tfrms.get(j).getInputColumns().get(0).getScale();

                    if (dataType.equalsIgnoreCase("number") && vSourceComponent.equalsIgnoreCase("Teradata")){
                        dataType = "decimal";
                        dataLength = 4;
                        dataPrecision = 4;
                    }

                    if (dataType.equalsIgnoreCase("DATE") || dataType.equalsIgnoreCase("DATETIME")){
                        dataType = "DATE";
                        dataLength = "10";
                        dataPrecision = "10";
                    }

                    if (dataType.toUpperCase().contains("TIMESTAMP")){
                        dataType = "TIMESTAMP";
                        dataLength = "29";
                        dataPrecision = "19";
                        dataScale = "0";
                    }

                    if (dataType.equalsIgnoreCase("LONGVARCHAR")){
                        dataType = "VARCHAR";
                        dataLength = "255";
                        dataPrecision = "255";
                    }

                    if (dataType.equalsIgnoreCase("BYTEINT")){
                        dataType = "INTEGER";
                        dataLength = "10";
                        dataPrecision = "10";
                    }

                }
                src.append("        <SOURCEFIELD BUSINESSNAME =\"\" DATATYPE =\""+dataType+"\" DESCRIPTION =\"\" FIELDNUMBER =\""+(j+1)+"\" FIELDPROPERTY =\"0\" FIELDTYPE =\"ELEMITEM\" HIDDEN =\"NO\" KEYTYPE =\"NOT A KEY\" LENGTH =\"0\" LEVEL =\"0\" NAME =\""+sourceColumnName+"\" NULLABLE =\"NULL\" OCCURS =\"0\" OFFSET =\"0\" PHYSICALLENGTH =\""+dataLength+"\" PHYSICALOFFSET =\"0\" PICTURETEXT =\"\" PRECISION =\""+dataPrecision+"\" SCALE =\""+dataScale+"\" USAGE_FLAGS =\"\"/>\n");

            }
        }

    src.append("    </SOURCE> \n");

    return src;
}

/** Creates Informatica .xml Target Details creation point */
function Target(){

    var tgtData = new java.lang.StringBuffer();
    var tgtLkp = new java.lang.StringBuffer();
    var tgt = new java.lang.StringBuffer();
    var tfrms =  mapping.getTransformations();

    var targetTableName = "";
    var targetTable = "";
    var tgtSchema = "";

    var targetColumnName = "";
    var dataType = "";
    var dataLength = "";
    var dataPrecision = "";
    var dataScale = "";
    var targetColumnClass = "";

    /** If Target Schema exist in Context it will consider that value else default */
    if(vTargetSchema.trim().equals("")){
        tgtSchema="dbo";
    }
    else{
        tgtSchema=vTargetSchema;
    }

    /** Iterate over the mapping specifications to get the Target Table Name */
    for (var i=0;i<tfrms.size();
         i++) 
    {
        if (tfrms.get(i).getOutputColumns().size()>0) {

            if (!tfrms.get(i).getOutputColumns().get(0).getParentTable().getCompleteName().equals("SYS1") && !tfrms.get(i).getOutputColumns().get(0).getParentTable().getCompleteName().equals("")){
                targetTable = tfrms.get(i).getOutputColumns().get(0).getParentTable().getCompleteName();
            }
        }
    }

    targetTableName = targetTable.substring(targetTable.indexOf(".")+1);

    tgtLkp.append("    <SOURCE BUSINESSNAME =\"\" DATABASETYPE =\""+vTargetComponent+"\" DBDNAME =\""+vSourceDB+"\" DESCRIPTION =\"\" NAME =\"" +targetTableName+ "\" OBJECTVERSION =\"1\" OWNERNAME =\""+tgtSchema+"\" VERSIONNUMBER =\"1\"> \n");
    tgt.append("    <TARGET BUSINESSNAME =\"\" CONSTRAINT =\"\" DATABASETYPE =\""+vTargetComponent+"\" DESCRIPTION =\"\" NAME =\"" +targetTableName+ "\" OBJECTVERSION =\"1\" TABLEOPTIONS =\"\" VERSIONNUMBER =\"1\"> \n");


    /** Iterate over the mapping specifications to get the Target Columns Details */
    for (var j=0;j<tfrms.size();
         j++)

        if (tfrms.get(j).getOutputColumns().size()>0) {

            if (!tfrms.get(j).getOutputColumns().get(0).getParentTable().getCompleteName().equals("SYS1")){
                if (!tfrms.get(j).getOutputColumns().get(0).getParentTable().getCompleteName().equals("")) {

                    targetColumnName = tfrms.get(j).getOutputColumns().get(0).getColumnName();
                    dataType = tfrms.get(j).getOutputColumns().get(0).getDataType();
                    dataLength = tfrms.get(j).getOutputColumns().get(0).getLength();
                    dataPrecision = tfrms.get(j).getOutputColumns().get(0).getPrecision();
                    dataScale = tfrms.get(j).getOutputColumns().get(0).getScale();
                    targetColumnClass = tfrms.get(j).getOutputColumns().get(0).getColumnClass();

                    if (dataType.equalsIgnoreCase("number") && vSourceComponent.equalsIgnoreCase("Teradata")){
                        dataType = "decimal";
                        dataLength = 4;
                        dataPrecision = 4;
                    }

                    if (dataType.toUpperCase().contains("TIMESTAMP")){
                        dataType = "TIMESTAMP";
                        dataLength = "26";
                        dataPrecision = "19";
                        dataScale = "0";
                    }

                    if (dataType.equalsIgnoreCase("BYTEINT")){
                        dataType = "INTEGER";
                        dataLength = 10;
                        dataPrecision = 10;
                    }

                    if (dataType.equalsIgnoreCase("LONGVARCHAR")){
                        dataType = "VARCHAR";
                        dataLength = 255;
                        dataPrecision = 255;
                    }


                    if (dataType.equalsIgnoreCase("DATE") || dataType.equalsIgnoreCase("DATETIME") ){
                        dataType = "DATE";
                        dataLength = "10";
                        dataPrecision = "10";
                    }

                }

                tgtLkp.append("        <SOURCEFIELD BUSINESSNAME =\"\" DATATYPE =\""+dataType+"\" DESCRIPTION =\"\" FIELDNUMBER =\""+(j+1)+"\" FIELDPROPERTY =\"0\" FIELDTYPE =\"ELEMITEM\" HIDDEN =\"NO\" KEYTYPE =\"NOT A KEY\" LENGTH =\"0\" LEVEL =\"0\" NAME =\""+targetColumnName+"\" NULLABLE =\"NULL\" OCCURS =\"0\" OFFSET =\"0\" PHYSICALLENGTH =\""+dataLength+"\" PHYSICALOFFSET =\"0\" PICTURETEXT =\"\" PRECISION =\""+dataPrecision+"\" SCALE =\""+dataScale+"\" USAGE_FLAGS =\"\"/>\n");

                tgt.append("        <TARGETFIELD BUSINESSNAME =\"\" DATATYPE =\""+dataType+"\" DESCRIPTION =\"\" FIELDNUMBER =\""+(j+1)+"\" KEYTYPE =\"NOT A KEY\" NAME =\""+targetColumnName+"\" NULLABLE =\"NULL\" PICTURETEXT =\"\" PRECISION =\""+dataPrecision+"\" SCALE =\""+dataScale+"\"/>  \n");
            }
        }

    tgtLkp.append("    </SOURCE> \n");
    tgt.append("    </TARGET> \n");
    tgt.append("</FOLDER>\n");



    tgtData.append(tgtLkp);
    tgtData.append(tgt);

    return tgtData;

}


/** Creates Informatica .xml Shared transformation point */
function SharedTrans(){

    var SharedTrns = new java.lang.StringBuffer();

    SharedTrns.append("<FOLDER NAME=\""+vSharedTrans+"\" GROUP=\"\" OWNER=\""+vOwner+"\" SHARED=\"SHARED\" DESCRIPTION=\"\" PERMISSIONS=\"rwx---r--\" UUID=\"2f84af23-6f9e-4bdb-9bb6-3da8a76ca687\"> \n");
    SharedTrns.append("    <TRANSFORMATION DESCRIPTION =\"\" NAME =\"exp_SET_DWH_COLUMNS\" OBJECTVERSION =\"1\" REUSABLE =\"YES\" TYPE =\"Expression\" VERSIONNUMBER =\"1\"> \n");
    SharedTrns.append("        <TRANSFORMFIELD DATATYPE =\"integer\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" NAME =\"IN_FIELD_NUM\" PICTURETEXT =\"\" PORTTYPE =\"INPUT\" PRECISION =\"10\" SCALE =\"0\"/> \n");
    SharedTrns.append("        <TRANSFORMFIELD DATATYPE =\"string\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" NAME =\"IN_FIELD_CHAR\" PICTURETEXT =\"\" PORTTYPE =\"INPUT\" PRECISION =\"10\" SCALE =\"0\"/> \n");
    SharedTrns.append("        <TRANSFORMFIELD DATATYPE =\"integer\" DEFAULTVALUE =\"ERROR(&apos;transformation error&apos;)\" DESCRIPTION =\"\" EXPRESSION =\"TO_INTEGER($PMWorkflowRunId)\" EXPRESSIONTYPE =\"GENERAL\" NAME =\"DWH_LOAD_ID\" PICTURETEXT =\"\" PORTTYPE =\"OUTPUT\" PRECISION =\"10\" SCALE =\"0\"/> \n");
    SharedTrns.append("        <TRANSFORMFIELD DATATYPE =\"string\" DEFAULTVALUE =\"ERROR(&apos;transformation error&apos;)\" DESCRIPTION =\"\" EXPRESSION =\"$PMSessionName\" EXPRESSIONTYPE =\"GENERAL\" NAME =\"DWH_JOB\" PICTURETEXT =\"\" PORTTYPE =\"OUTPUT\" PRECISION =\"100\" SCALE =\"0\"/> \n");
    SharedTrns.append("        <TABLEATTRIBUTE NAME =\"Tracing Level\" VALUE =\"Normal\"/> \n");
    SharedTrns.append("    </TRANSFORMATION> \n");
    SharedTrns.append("</FOLDER> \n");

    return SharedTrns;


}

/** Creates Informatica .xml Mapping Details creation point */
function MappingDetails(){

    var mappingDetailsOut = new java.lang.StringBuffer();
    var sqSrc = new java.lang.StringBuffer();
    var sqTgt = new java.lang.StringBuffer();
    var expTgt = new java.lang.StringBuffer();
    var expT = new java.lang.StringBuffer();
    var expT1 = new java.lang.StringBuffer();
    var jnrT = new java.lang.StringBuffer();
    var filT = new java.lang.StringBuffer();
    var rtr = new java.lang.StringBuffer();
    var rtr1 = new java.lang.StringBuffer();
    var rtr2 = new java.lang.StringBuffer();
    var rtr3 = new java.lang.StringBuffer();
    var rtr4 = new java.lang.StringBuffer();
    var uni = new java.lang.StringBuffer();
    var uni1 = new java.lang.StringBuffer();
    var uni2 = new java.lang.StringBuffer();
    var uni3 = new java.lang.StringBuffer();
    var expI = new java.lang.StringBuffer();
    var expU = new java.lang.StringBuffer();
    var expD = new java.lang.StringBuffer();
    var expC = new java.lang.StringBuffer();
    var exp = new java.lang.StringBuffer();
    var fldDpnd = new java.lang.StringBuffer();
    var srtT = new java.lang.StringBuffer();
    var updStg = new java.lang.StringBuffer();
    var inst = new java.lang.StringBuffer();
    var conctSqSrc = new java.lang.StringBuffer();
    var conctSqTgt = new java.lang.StringBuffer();
    var conctExpT = new java.lang.StringBuffer();
    var conctExpT1 = new java.lang.StringBuffer();
    var conctExpTgt = new java.lang.StringBuffer();
    var conctJnrT = new java.lang.StringBuffer();
    var conctUpd = new java.lang.StringBuffer();
    var conctSrt = new java.lang.StringBuffer();
    var conctRtr = new java.lang.StringBuffer();
    var conctUpI = new java.lang.StringBuffer();
    var conctUpU = new java.lang.StringBuffer();
    var conctUpDl = new java.lang.StringBuffer();
    var conctUnion = new java.lang.StringBuffer();
    var conctJav = new java.lang.StringBuffer();
    var HKeyData = new java.lang.StringBuffer();
    var HDiffData = new java.lang.StringBuffer();
    var JavaComp = new java.lang.StringBuffer();

    var sourceColumnName = "";
    var targetColumnName="";
    var srcExpDataType="";
    var expressionFields ="";
    var sortKey ="";
    var srcDataLength ="";
    var srcDataType ="";
    var srcDataPrecision ="";
    var srcDataScale ="";
    var srcDataTypeFormat ="";
    var tgtDataLength ="";
    var tgtDataType ="";
    var tgtDataPrecision ="";
    var tgtDataScale ="";
    var tgtDataTypeFormat ="";
    var tgtColCls ="";
    var portType ="";
    var expValue ="";
    var STG_RSRC_VAL ="";
    var md5HK = "";
    var md5HDiff = "";
    var sBKey = "";
    var tBKey = "";
    var srcTgtCol = "";
    var sourceTable = "";
    var targetTable = "";
    var sourceTableName = "";
    var targetTableName = "";
    var sourceBKeyColumn ="";
    var sourceUserColumn ="";


    JavaComp.append("    <TRANSFORMATION COMPONENTVERSION =\"1000000\" DESCRIPTION =\"\" NAME =\"Java_Convert_MD5ToBinary\" OBJECTVERSION =\"1\" REUSABLE =\"YES\" TEMPLATEID =\"303049\" TEMPLATENAME =\"Java Transformation\" TYPE =\"Custom Transformation\" VERSIONNUMBER =\"6\"> \n");
    JavaComp.append("        <GROUP DESCRIPTION =\"\" NAME =\"INPUT\" ORDER =\"1\" TYPE =\"INPUT\"/> \n");
    JavaComp.append("        <GROUP DESCRIPTION =\"\" NAME =\"OUTPUT\" ORDER =\"2\" TYPE =\"OUTPUT\"/> \n");
    JavaComp.append("        <TRANSFORMFIELD DATATYPE =\"string\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" GROUP =\"INPUT\" NAME =\"INPUT\" OUTPUTGROUP =\"INPUT\" PICTURETEXT =\"\" PORTTYPE =\"INPUT\" PRECISION =\"100\" SCALE =\"0\"/> \n");
    JavaComp.append("        <TRANSFORMFIELD DATATYPE =\"binary\" DEFAULTVALUE =\"ERROR(&apos;transformation error&apos;)\" DESCRIPTION =\"\" GROUP =\"INPUT\" NAME =\"BINARY_OUTPUT\" OUTPUTGROUP =\"OUTPUT\" PICTURETEXT =\"\" PORTTYPE =\"OUTPUT\" PRECISION =\"16\" SCALE =\"0\"/> \n");
    JavaComp.append("        <TABLEATTRIBUTE NAME =\"Language\" VALUE =\"Java\"/> \n");
    JavaComp.append("        <TABLEATTRIBUTE NAME =\"Module Identifier\" VALUE =\"\"/> \n");
    JavaComp.append("        <TABLEATTRIBUTE NAME =\"Class Name\" VALUE =\"com/informatica/powercenter/server/jtx/JTXPluginImpl\"/> \n");
    JavaComp.append("        <TABLEATTRIBUTE NAME =\"Function Identifier\" VALUE =\"\"/> \n");
    JavaComp.append("        <TABLEATTRIBUTE NAME =\"Runtime Location\" VALUE =\"\"/> \n");
    JavaComp.append("        <TABLEATTRIBUTE NAME =\"Tracing Level\" VALUE =\"Normal\"/> \n");
    JavaComp.append("        <TABLEATTRIBUTE NAME =\"Is Partitionable\" VALUE =\"Locally\"/> \n");
    JavaComp.append("        <TABLEATTRIBUTE NAME =\"Inputs Must Block\" VALUE =\"NO\"/> \n");
    JavaComp.append("        <TABLEATTRIBUTE NAME =\"Is Active\" VALUE =\"NO\"/> \n");
    JavaComp.append("        <TABLEATTRIBUTE NAME =\"Update Strategy Transformation\" VALUE =\"NO\"/> \n");
    JavaComp.append("        <TABLEATTRIBUTE NAME =\"Transformation Scope\" VALUE =\"Row\"/> \n");
    JavaComp.append("        <TABLEATTRIBUTE NAME =\"Generate Transaction\" VALUE =\"NO\"/> \n");
    JavaComp.append("        <TABLEATTRIBUTE NAME =\"Output Is Repeatable\" VALUE =\"Based On Input Order\"/> \n");
    JavaComp.append("        <TABLEATTRIBUTE NAME =\"Requires Single Thread Per Partition\" VALUE =\"YES\"/> \n");
    JavaComp.append("        <TABLEATTRIBUTE NAME =\"Output Is Deterministic\" VALUE =\"YES\"/> \n");
    JavaComp.append("        <TABLEATTRIBUTE NAME =\"Preserves Data Set Boundary\" VALUE =\"No\"/> \n");
    JavaComp.append("        <INITPROP DESCRIPTION =\"\" NAME =\"Programmatic Identifier for Class Factory\" USERDEFINED =\"NO\" VALUE =\"\"/> \n");
    JavaComp.append("        <INITPROP DESCRIPTION =\"\" NAME =\"Constructor\" USERDEFINED =\"NO\" VALUE =\"\"/> \n");
    JavaComp.append("        <METADATAEXTENSION COMPONENTVERSION =\"1000000\" DATATYPE =\"STRING\" DESCRIPTION =\"\" DOMAINNAME =\"Java_Transform_Domain\" ISCLIENTEDITABLE =\"NO\" ISCLIENTVISIBLE =\"NO\" ISREUSABLE =\"YES\" ISSHAREREAD =\"YES\" ISSHAREWRITE =\"YES\" MAXLENGTH =\"2147483647\" NAME =\"Byte_Code\" VALUE =\"yv66vgAAADMA8AoAQwBhBwBiCgACAGEJAEIAYwsAZABlBwBmCgAGAGcJAEIAaAoAQgBpCABqCgBCAGsKAGwAbQoABgBuCABGCgBCAG8KAEIAcAoAQgBxCgBCAHIHAHMJAEIAdAoAdQB2CQBCAHcJAEIAeAoAdQB5CgACAHoKAHUAewoAAgB8CQBCAH0JAEIAfgkAQgB/CgCAAIEKAIIAgwcAhAoAIQBhCACFCgAhAIYKACEAfAoAQgCHBwCICgAnAIkKAIIAigoAiwCMCQBCAI0HAI4JAEIAjwoALACJCQBCAJAJAEIAkQoAQgCSBwCTCgBCAJQKAEIAlQkAQgCWCQBCAJcKAEIAmAkAQgCZCgCaAHwKAEIAmwkAQgCcCgATAJ0KABMAngcAnwoAQgCgCgBCAKEKAEIAogcAowcApAEABnN0ckJ1ZgEAGExqYXZhL2xhbmcvU3RyaW5nQnVmZmVyOwEADUJJTkFSWV9PVVRQVVQBAAJbQgEABjxpbml0PgEAAygpVgEABENvZGUBAA9MaW5lTnVtYmVyVGFibGUBAARpbml0AQAjKExqYXZhL3V0aWwvTGlzdDtMamF2YS91dGlsL0xpc3Q7KVYBAA1TdGFja01hcFRhYmxlBwBmAQAKRXhjZXB0aW9ucwEAB2V4ZWN1dGUBAGsoTGNvbS9pbmZvcm1hdGljYS9wb3dlcmNlbnRlci9zZGsvcmVwb3NpdG9yeS9JR3JvdXA7TGNvbS9pbmZvcm1hdGljYS9wb3dlcmNlbnRlci9zZGsvc2VydmVyL0lJbnB1dEJ1ZmZlcjspVgcAowcApQcApgcApwcARwcAkwEAD2VvZk5vdGlmaWNhdGlvbgEANihMY29tL2luZm9ybWF0aWNhL3Bvd2VyY2VudGVyL3Nkay9yZXBvc2l0b3J5L0lHcm91cDspVgEAEGlucHV0VHJhbnNhY3Rpb24BAAQoSSlWAQALZ2VuZXJhdGVSb3cHAJ8BAApTb3VyY2VGaWxlAQAeSlRYUGFydGl0aW9uRHJpdmVySW1wbEdlbi5qYXZhDABIAEkBABZqYXZhL2xhbmcvU3RyaW5nQnVmZmVyDABEAEUHAKgMAKkAqgEAMmNvbS9pbmZvcm1hdGljYS9wb3dlcmNlbnRlci9zZGsvc2VydmVyL0lCdWZmZXJJbml0DACrAKwMAK0ArgwArwBJAQAFSU5QVVQMALAAsQcAsgwAswC0DAC1ALYMALcAsQwAuAC5DAC6AEkMALsAvAEANGNvbS9pbmZvcm1hdGljYS9wb3dlcmNlbnRlci9zZGsvc2VydmVyL0lPdXRwdXRCdWZmZXIMAL0AvgcApgwAvwCsDADAAK4MAEYARwwAwQDCDADDAFwMAMQAxQwAxgDHDADIAMkMAMoAywwAzADNBwDODADPANAHAKcMANEArAEAF2phdmEvbGFuZy9TdHJpbmdCdWlsZGVyAQBURXhjZXB0aW9uIGluIGhleFN0cmluZ1RvQnl0ZUFycmF5OiBFeHBlY3RlZCAzMiBjaGFyYWN0ZXJzIHRvIHBhcnNlLCByZWNlaXZlZCBpbnB1dDogDADSANMMANQA1QEAGmphdmEvbGFuZy9SdW50aW1lRXhjZXB0aW9uDABIANUMANYA1wcA2AwA2QDaDADbAMkBADhjb20vaW5mb3JtYXRpY2EvcG93ZXJjZW50ZXIvc2VydmVyL2p0eC9KVFhGYXRhbEV4Y2VwdGlvbgwA3ADdDADeAM0MAN8AyQwAXQBJAQAsY29tL2luZm9ybWF0aWNhL3Bvd2VyY2VudGVyL3Nkay9TREtFeGNlcHRpb24MAOAA4QwA4gBJDADjAM0MAOQAzQwA5QBJDADmAM0HAOcMAOgAsQwA6QCuDADqALYMAOsA7AEAPWNvbS9pbmZvcm1hdGljYS9wb3dlcmNlbnRlci9zZGsvc2VydmVyL0RhdGFUcnVuY2F0ZWRFeGNlcHRpb24MAO0A1QwA7gBJDADvAEkBAEBjb20vaW5mb3JtYXRpY2EvcG93ZXJjZW50ZXIvc2VydmVyL2p0eC9KVFhQYXJ0aXRpb25Ecml2ZXJJbXBsR2VuAQBCY29tL2luZm9ybWF0aWNhL3Bvd2VyY2VudGVyL3NlcnZlci9qdHgvSlRYUGFydGl0aW9uRHJpdmVySW1wbEZpeGVkAQAxY29tL2luZm9ybWF0aWNhL3Bvd2VyY2VudGVyL3Nkay9yZXBvc2l0b3J5L0lHcm91cAEAM2NvbS9pbmZvcm1hdGljYS9wb3dlcmNlbnRlci9zZGsvc2VydmVyL0lJbnB1dEJ1ZmZlcgEAEGphdmEvbGFuZy9TdHJpbmcBAA5qYXZhL3V0aWwvTGlzdAEAA2dldAEAFShJKUxqYXZhL2xhbmcvT2JqZWN0OwEAC2dldENhcGFjaXR5AQADKClJAQAMb3V0cHV0QnVmQ2FwAQABSQEACmluaXRpYWxpemUBABBpc0luRmxkQ29ubmVjdGVkAQAVKExqYXZhL2xhbmcvU3RyaW5nOylaAQAvY29tL2luZm9ybWF0aWNhL3Bvd2VyY2VudGVyL3NlcnZlci9qdHgvSlRYVXRpbHMBABNpc1NlcnZlclVuaWNvZGVNb2RlAQADKClaAQASYmluZENvbHVtbkRhdGFUeXBlAQAFKElJKVYBABFpc091dEZsZFByb2plY3RlZAEADnNldElucHV0QnVmZmVyAQA4KExjb20vaW5mb3JtYXRpY2EvcG93ZXJjZW50ZXIvc2RrL3NlcnZlci9JSW5wdXRCdWZmZXI7KVYBABRyZXNldE91dHB1dFJvd051bWJlcgEAEGdldE91dHB1dEJ1ZmZlcnMBABIoKUxqYXZhL3V0aWwvTGlzdDsBAAlvdXRwdXRCdWYBADZMY29tL2luZm9ybWF0aWNhL3Bvd2VyY2VudGVyL3Nkay9zZXJ2ZXIvSU91dHB1dEJ1ZmZlcjsBABNnZXROdW1Sb3dzQXZhaWxhYmxlAQAIaW5Sb3dOdW0BAAZpc051bGwBAAUoSUkpWgEACXNldExlbmd0aAEAD2dldFN0cmluZ0J1ZmZlcgEAHShJSUxqYXZhL2xhbmcvU3RyaW5nQnVmZmVyOylJAQAIdG9TdHJpbmcBABQoKUxqYXZhL2xhbmcvU3RyaW5nOwEACWlzVmVyYm9zZQEAAVoBAAt1dGlsc1NlcnZlcgEANUxjb20vaW5mb3JtYXRpY2EvcG93ZXJjZW50ZXIvc2RrL3NlcnZlci9JVXRpbHNTZXJ2ZXI7AQAPQkVHSU5fSU5QVVRfUk9XAQAsTGNvbS9pbmZvcm1hdGljYS9wb3dlcmNlbnRlci9zZGsvU0RLTWVzc2FnZTsBADNjb20vaW5mb3JtYXRpY2EvcG93ZXJjZW50ZXIvc2RrL3NlcnZlci9JVXRpbHNTZXJ2ZXIBAAZsb2dNc2cBADAoSUxjb20vaW5mb3JtYXRpY2EvcG93ZXJjZW50ZXIvc2RrL1NES01lc3NhZ2U7KVYBAAZsZW5ndGgBAAZhcHBlbmQBAC0oTGphdmEvbGFuZy9TdHJpbmc7KUxqYXZhL2xhbmcvU3RyaW5nQnVpbGRlcjsBAAhsb2dFcnJvcgEAFShMamF2YS9sYW5nL1N0cmluZzspVgEABmNoYXJBdAEABChJKUMBABNqYXZhL2xhbmcvQ2hhcmFjdGVyAQAFZGlnaXQBAAUoQ0kpSQEAFmlzRmF0YWxFeGNlcHRpb25UaHJvd24BAAhmYXRhbE1zZwEAEkxqYXZhL2xhbmcvU3RyaW5nOwEADkVYSVRfSU5QVVRfUk9XAQAMaXNHZW5Sb3dDYWxsAQAPaGFuZGxlRXhjZXB0aW9uAQAxKExjb20vaW5mb3JtYXRpY2EvcG93ZXJjZW50ZXIvc2RrL1NES0V4Y2VwdGlvbjspVgEAEnByZXBhcmVGb3JJbnB1dFJvdwEAEUJFR0lOX0VORF9PRl9EQVRBAQAQRVhJVF9FTkRfT0ZfREFUQQEACGZsdXNoQnVmAQAYSU5WQUxJRF9BUElfQ0FMTF9QQVNTSVZFAQAqY29tL2luZm9ybWF0aWNhL3Bvd2VyY2VudGVyL3Nkay9TREtNZXNzYWdlAQAPaXNTZXROdWxsQ2FsbGVkAQAJb3V0Um93TnVtAQAHc2V0TnVsbAEACHNldEJ5dGVzAQAJKElJW0JJSSlWAQAcaGFuZGxlRGF0YVRydW5jYXRlZEV4Y2VwdGlvbgEAGGluY3JlbWVudE91dHB1dFJvd051bWJlcgEAD2NsZWFyTnVsbENvbFNldAAhAEIAQwAAAAIAAgBEAEUAAAACAEYARwAAAAYAAQBIAEkAAQBKAAAALAADAAEAAAAQKrcAASq7AAJZtwADtQAEsQAAAAEASwAAAAoAAgAAACkABAA6AAEATABNAAIASgAAAKgAAwAFAAAAVSsDuQAFAgDAAAZOLAO5AAUCAMAABjoEKhkEtgAHtQAIKrYACSoSCrYAC5kAGbgADJkADS0DEAe2AA2nAAktAwi2AA0qEg62AA+ZAAsZBAMQBrYADbEAAAACAEsAAAAuAAsAAABFAAsARgAXAEcAIABIACQASgAtAEwAMwBNAD0ATwBDAFIATABUAFQAVgBOAAAADQAD/QA9BwBPBwBPBRAAUAAAAAQAAQAyAAEAUQBSAAIASgAAAoIABgAKAAABTyostgAQKrYAESoqtgASA7kABQIAwAATtQAULLYAFT4qA7UAFgQ2BhUGHaMBJCoBtQAXAToFKhIKtgALmQAuLCq0ABYDtgAYmgAiKrQABAO2ABksKrQAFgMqtAAEtgAaVyq0AAS2ABs6BSq0AByZAA8qtAAdEAiyAB62AB8ZBccAEAO8CDoHKgG1ABenAHoZBbYAIDYIFQgQIJ8AKbsAIVm3ACISI7YAJBkFtgAktgAlOgkqGQm2ACa7ACdZGQm3ACi/FQgFbLwIOgcDNgkVCRUIogAuGQcVCQVsGQUVCbYAKRAQuAAqB3gZBRUJBGC2ACkQELgAKmCRVIQJAqf/0SoZB7UAFyq0ACuZAA+7ACxZKrQALbcALr8qtAAcmQAPKrQAHRAIsgAvtgAfKgS1ADAqtwAxKgO1ADCnAAs6ByoZB7YAMyq2ADSEBgGn/tyxAAEALQE5ATwAMgACAEsAAACiACgAAABgAAUAYQAJAGIAGgBjAB8AZAAkAGkALQBuADIAcQA1AHQASgB2AFIAdwBgAHgAaQB7AHAAfQB8AJwAgQCeAIYAnwCOAKEAlQCiAJwAowCyAKUAuACmAMIAqADKAKkA1ACrAPkAqQD/ALABBQC4AQwAugEYAL0BHwC/ASsAwgEwAMMBNADEATkAyQE8AMYBPgDIAUQAygFIAGkBTgDMAE4AAABxAA3/ACcABwcAUwcAVAcAVQEAAAEAAP8AQQAHBwBTBwBUBwBVAQAHAFYBAAASEf0AMwAB/wAKAAoHAFMHAFQHAFUBAAcAVgEHAFcBAQAA+gAx+gAFEhL/ABAABwcAUwcAVAcAVQEAAAEAAQcAWAf4AAkAUAAAAAQAAQAyAAEAWQBaAAIASgAAALgAAwADAAAAWyq0ABTHABQqKrYAEgO5AAUCAMAAE7UAFCq0AByZAA8qtAAdEAiyADW2AB8qtAArmQAPuwAsWSq0AC23AC6/KrQAHJkADyq0AB0QCLIANrYAH6cACU0qLLYAM7EAAQAAAFEAVAAyAAIASwAAADIADAAAANcABwDZABgA3AAfAN4AKwDsADIA7gA+APAARQDyAFEA+ABUAPUAVQD3AFoA+QBOAAAACwAGGBISEkIHAFgFAFAAAAAEAAEAMgABAFsAXAACAEoAAABgAAMAAwAAAB8qtgA3Kiq2ABIDuQAFAgDAABO1ABSnAAlNKiy2ADOxAAEAAAAVABgAMgACAEsAAAAaAAYAAAEFAAQBBgAVAQsAGAEIABkBCgAeAQwATgAAAAcAAlgHAFgFAFAAAAAEAAEAMgACAF0ASQACAEoAAADBAAYAAgAAAGYqtAAwmgARuwAsWbIAOLYAObcALr8qEg62AA+ZAEIqEg62ADqaADkqtAAXxwASKrQAFCq0ADsDtgA8pwAjKrQAFCq0ADsDKrQAFwMqtAAXvrYAPacACkwqEg62AD8qtgBAKrYAQbEAAQA9AFMAVgA+AAIASwAAADIADAAAARYABwEYABUBGgAnARwALgEdAD0BIgBTAScAVgEkAFcBJgBdASoAYQErAGUBLABOAAAACQAEFSdYBwBeBgBQAAAABAABADIAAQBfAAAAAgBg\" VENDORNAME =\"INFORMATICA\"/> \n");
    JavaComp.append("        <METADATAEXTENSION COMPONENTVERSION =\"1000000\" DATATYPE =\"NUMERIC\" DESCRIPTION =\"\" DOMAINNAME =\"Java_Transform_Domain\" ISCLIENTEDITABLE =\"NO\" ISCLIENTVISIBLE =\"NO\" ISREUSABLE =\"YES\" ISSHAREREAD =\"YES\" ISSHAREWRITE =\"YES\" MAXLENGTH =\"0\" NAME =\"Byte_Code_Len\" VALUE =\"4758\" VENDORNAME =\"INFORMATICA\"/> \n");
    JavaComp.append("        <METADATAEXTENSION COMPONENTVERSION =\"1000000\" DATATYPE =\"STRING\" DESCRIPTION =\"\" DOMAINNAME =\"Java_Transform_Domain\" ISCLIENTEDITABLE =\"NO\" ISCLIENTVISIBLE =\"NO\" ISREUSABLE =\"YES\" ISSHAREREAD =\"YES\" ISSHAREWRITE =\"YES\" MAXLENGTH =\"2147483647\" NAME =\"Byte_Codes_Inner_Classes\" VALUE =\"\" VENDORNAME =\"INFORMATICA\"/> \n");
    JavaComp.append("        <METADATAEXTENSION COMPONENTVERSION =\"1000000\" DATATYPE =\"NUMERIC\" DESCRIPTION =\"\" DOMAINNAME =\"Java_Transform_Domain\" ISCLIENTEDITABLE =\"NO\" ISCLIENTVISIBLE =\"NO\" ISREUSABLE =\"YES\" ISSHAREREAD =\"YES\" ISSHAREWRITE =\"YES\" MAXLENGTH =\"0\" NAME =\"CRC\" VALUE =\"-1352870807\" VENDORNAME =\"INFORMATICA\"/> \n");
    JavaComp.append("        <METADATAEXTENSION COMPONENTVERSION =\"1000000\" DATATYPE =\"NUMERIC\" DESCRIPTION =\"\" DOMAINNAME =\"Java_Transform_Domain\" ISCLIENTEDITABLE =\"NO\" ISCLIENTVISIBLE =\"NO\" ISREUSABLE =\"YES\" ISSHAREREAD =\"YES\" ISSHAREWRITE =\"YES\" MAXLENGTH =\"0\" NAME =\"Enable_High_Precision\" VALUE =\"1\" VENDORNAME =\"INFORMATICA\"/> \n");
    JavaComp.append("        <METADATAEXTENSION COMPONENTVERSION =\"1000000\" DATATYPE =\"STRING\" DESCRIPTION =\"\" DOMAINNAME =\"Java_Transform_Domain\" ISCLIENTEDITABLE =\"NO\" ISCLIENTVISIBLE =\"NO\" ISREUSABLE =\"YES\" ISSHAREREAD =\"YES\" ISSHAREWRITE =\"YES\" MAXLENGTH =\"20971520\" NAME =\"Helper_Code_Snippet\" VALUE =\"// ToDo: Declare static and non-static  partition level variables and functions here&#xA;// For example,&#xA;// &#xA;// static int countNullRows;            // counts the number of output rows across all partitions containing null values&#xA;// int partCountNullRows;               // counts the number of output rows in this partition containing null values&#xA;// &#xA;// static Object lock = new Object();   // lock to synchronize countNullRows&#xA;&#xA;&#xA;\" VENDORNAME =\"INFORMATICA\"/> \n");
    JavaComp.append("        <METADATAEXTENSION COMPONENTVERSION =\"1000000\" DATATYPE =\"STRING\" DESCRIPTION =\"\" DOMAINNAME =\"Java_Transform_Domain\" ISCLIENTEDITABLE =\"NO\" ISCLIENTVISIBLE =\"NO\" ISREUSABLE =\"YES\" ISSHAREREAD =\"YES\" ISSHAREWRITE =\"YES\" MAXLENGTH =\"20971520\" NAME =\"Import_Packages_Snippet\" VALUE =\"// ToDo: Enter the Java packages to be  imported here&#xA;// For example, if you want to use Hashtable in any of the snippets, import the Hashtable // as shown below:&#xA;// &#xA;// import java.util.Hashtable;&#xA;\" VENDORNAME =\"INFORMATICA\"/> \n");
    JavaComp.append("        <METADATAEXTENSION COMPONENTVERSION =\"1000000\" DATATYPE =\"STRING\" DESCRIPTION =\"\" DOMAINNAME =\"Java_Transform_Domain\" ISCLIENTEDITABLE =\"NO\" ISCLIENTVISIBLE =\"NO\" ISREUSABLE =\"YES\" ISSHAREREAD =\"YES\" ISSHAREWRITE =\"YES\" MAXLENGTH =\"20971520\" NAME =\"Infa_Functions_Snippet\" VALUE =\"\" VENDORNAME =\"INFORMATICA\"/> \n");
    JavaComp.append("        <METADATAEXTENSION COMPONENTVERSION =\"1000000\" DATATYPE =\"STRING\" DESCRIPTION =\"\" DOMAINNAME =\"Java_Transform_Domain\" ISCLIENTEDITABLE =\"NO\" ISCLIENTVISIBLE =\"NO\" ISREUSABLE =\"YES\" ISSHAREREAD =\"YES\" ISSHAREWRITE =\"YES\" MAXLENGTH =\"2147483647\" NAME =\"Java_Classpath\" VALUE =\"\" VENDORNAME =\"INFORMATICA\"/> \n");
    JavaComp.append("        <METADATAEXTENSION COMPONENTVERSION =\"1000000\" DATATYPE =\"STRING\" DESCRIPTION =\"\" DOMAINNAME =\"Java_Transform_Domain\" ISCLIENTEDITABLE =\"NO\" ISCLIENTVISIBLE =\"NO\" ISREUSABLE =\"YES\" ISSHAREREAD =\"YES\" ISSHAREWRITE =\"YES\" MAXLENGTH =\"2147483647\" NAME =\"Names_Of_Inner_Classes\" VALUE =\"\" VENDORNAME =\"INFORMATICA\"/> \n");
    JavaComp.append("        <METADATAEXTENSION COMPONENTVERSION =\"1000000\" DATATYPE =\"NUMERIC\" DESCRIPTION =\"\" DOMAINNAME =\"Java_Transform_Domain\" ISCLIENTEDITABLE =\"NO\" ISCLIENTVISIBLE =\"NO\" ISREUSABLE =\"YES\" ISSHAREREAD =\"YES\" ISSHAREWRITE =\"YES\" MAXLENGTH =\"0\" NAME =\"Num_of_Inner_Classes\" VALUE =\"0\" VENDORNAME =\"INFORMATICA\"/> \n");
    JavaComp.append("        <METADATAEXTENSION COMPONENTVERSION =\"1000000\" DATATYPE =\"STRING\" DESCRIPTION =\"\" DOMAINNAME =\"Java_Transform_Domain\" ISCLIENTEDITABLE =\"NO\" ISCLIENTVISIBLE =\"NO\" ISREUSABLE =\"YES\" ISSHAREREAD =\"YES\" ISSHAREWRITE =\"YES\" MAXLENGTH =\"20971520\" NAME =\"OnEndOfData_Method_Snippet\" VALUE =\"// ToDo: Enter code that executes when all the input data is received by the transformation here&#xA;// &#xA;// logInfo(&quot;The number of null rows for this partition is : &quot; + partCountNullRows);&#xA;// synchronized(lock)&#xA;// {&#xA;//&#x9;&#x9;logInfo(&quot;The total number of null rows across partitions till now is : &quot; +  countNullRows);&#xA;// }&#xA;&#xA;&#xA;\" VENDORNAME =\"INFORMATICA\"/> \n");
    JavaComp.append("        <METADATAEXTENSION COMPONENTVERSION =\"1000000\" DATATYPE =\"STRING\" DESCRIPTION =\"\" DOMAINNAME =\"Java_Transform_Domain\" ISCLIENTEDITABLE =\"NO\" ISCLIENTVISIBLE =\"NO\" ISREUSABLE =\"YES\" ISSHAREREAD =\"YES\" ISSHAREWRITE =\"YES\" MAXLENGTH =\"20971520\" NAME =\"OnInputRow_Method_Snippet\" VALUE =\"// ToDo: Enter code to process an input row here.&#xA;// You can access an input column data by referring the input column name&#xA;// You can set an output column data by referring the output column name&#xA;// For example, if&#xA;// input1 and input2 are input ports of type int, and&#xA;// output1 and output2  are output ports of type int&#xA;// then transformation logic can be like as follows:&#xA;// &#xA;// if(!isNull(&quot;input1&quot;) &amp;&amp; !isNull(&quot;input1&quot;))&#xA;// {&#xA;//&#x9;&#x9;output1 = input1 + input2;&#xA;//&#x9;&#x9;output2 = input1 - input2;&#xA;// }&#xA;// else&#xA;// {&#xA;//&#x9;&#x9;setNull(&quot;output1&quot;);&#xA;//&#x9;&#x9;setNull(&quot;output2&quot;);&#xA;//&#x9;&#x9;partCountNullRows++;&#xA;//&#x9;&#x9;synchronized(lock)&#xA;//&#x9;&#x9;{&#xA;//&#x9;&#x9;&#x9;countNullRows++;&#xA;//&#x9;&#x9;}&#xA;// }&#xA;&#xA;//BINARY_OUTPUT&#xA;&#xA;&#x9;byte[] data;&#xA;    if (INPUT == null) &#xA;{&#xA;        data = new byte[0];&#xA;&#x9;&#x9;BINARY_OUTPUT = null;&#xA;    } else {&#xA;        int len = INPUT.length();&#xA;        if (len != 32) {&#xA;            String message = &quot;Exception in hexStringToByteArray: Expected 32 characters to parse, received input: &quot; + INPUT;&#xA;            &#xA;            logError(message);&#xA;            throw new RuntimeException(message);&#xA;        }&#xA;        data = new byte[len / 2];&#xA;        for (int i = 0; i &lt; len; i += 2) &#xA;&#x9;&#x9;{&#xA;            data[i / 2] = (byte) ((Character.digit(INPUT.charAt(i), 16) &lt;&lt; 4)&#xA;                    + Character.digit(INPUT.charAt(i + 1), 16));&#xA;&#xA;&#x9;&#x9;&#xA;&#x9;      }&#xA;&#x9;BINARY_OUTPUT = data;&#xA;    }&#xA;&#xA;&#x9;&#xA;&#xA;&#x9;\" VENDORNAME =\"INFORMATICA\"/> \n");
    JavaComp.append("        <METADATAEXTENSION COMPONENTVERSION =\"1000000\" DATATYPE =\"STRING\" DESCRIPTION =\"\" DOMAINNAME =\"Java_Transform_Domain\" ISCLIENTEDITABLE =\"NO\" ISCLIENTVISIBLE =\"NO\" ISREUSABLE =\"YES\" ISSHAREREAD =\"YES\" ISSHAREWRITE =\"YES\" MAXLENGTH =\"20971520\" NAME =\"OnTransaction_Method_Snippet\" VALUE =\"\" VENDORNAME =\"INFORMATICA\"/> \n");
    JavaComp.append("        <METADATAEXTENSION COMPONENTVERSION =\"1000000\" DATATYPE =\"NUMERIC\" DESCRIPTION =\"\" DOMAINNAME =\"Java_Transform_Domain\" ISCLIENTEDITABLE =\"NO\" ISCLIENTVISIBLE =\"NO\" ISREUSABLE =\"YES\" ISSHAREREAD =\"YES\" ISSHAREWRITE =\"YES\" MAXLENGTH =\"0\" NAME =\"Use_Nano_Seconds_In_Datetime\" VALUE =\"1\" VENDORNAME =\"INFORMATICA\"/> \n");
    JavaComp.append("    </TRANSFORMATION> \n");




    var mappingId = vmappingManagerUtil.getMapping(mapping.getMappindId());
    var tfrms =  mapping.getTransformations();

    mappingDetailsOut.append("<FOLDER NAME=\""+vNotSharedFolderName+"\" GROUP=\"\" OWNER=\""+vOwner+"\" SHARED=\"NOTSHARED\" DESCRIPTION=\"\" PERMISSIONS=\"rwx---r--\" UUID=\"3029a2ac-679d-45f9-81d4-6080d23df2f0\"> \n");
    mappingDetailsOut.append(JavaComp);
    mappingDetailsOut.append("    <MAPPING DESCRIPTION =\"\" ISVALID =\"YES\" NAME =\""+mappingId.getMappingName()+"\" OBJECTVERSION =\"1\" VERSIONNUMBER =\"1\"> \n");

    //     HKeyData.append("&apos;"+vHashDelimeter+"&apos;");
    //     HDiffData.append("&apos;"+vHashDelimeter+"&apos;");


    /** Iterate over the mapping specifications to get the BKey column, Source and Target Table Names */
    for (var y=0;y<tfrms.size();
         y++) 
    {
        if (tfrms.get(y).getInputColumns().size()>0) 
        {

            if (!tfrms.get(y).getInputColumns().get(0).getParentTable().getCompleteName().equals("SYS") && !tfrms.get(y).getInputColumns().get(0).getParentTable().getCompleteName().equals(""))  
            {
                sourceTable = tfrms.get(y).getInputColumns().get(0).getParentTable().getCompleteName();
                if ("BKEY".equals(tfrms.get(y).getOutputColumns().get(0).getColumnClass())){
                    
                    sourceBKeyColumn = tfrms.get(y).getOutputColumns().get(0).getColumnName();
                    
                    HKeyData.append("UPPER(LTRIM(RTRIM("+sourceBKeyColumn+"))) ||&apos;"+vHashDelimeter+"&apos;||");
                   
                }
            }
        }
    }


    for (var i=0;i<tfrms.size();
         i++) 
    {
        if (tfrms.get(i).getOutputColumns().size()>0){

            if (!tfrms.get(i).getOutputColumns().get(0).getParentTable().getCompleteName().equals("SYS1") && !tfrms.get(i).getOutputColumns().get(0).getParentTable().getCompleteName().equals("")){
                
                targetTable = tfrms.get(i).getOutputColumns().get(0).getParentTable().getCompleteName();

                if ("USER".equals(tfrms.get(i).getOutputColumns().get(0).getColumnClass()) || "BKEY".equals(tfrms.get(i).getOutputColumns().get(0).getColumnClass())){
                    sourceUserColumn = tfrms.get(i).getOutputColumns().get(0).getColumnName();
                    
                    HDiffData.append("IIF(ISNULL("+sourceUserColumn+"),&apos;&apos;,TO_CHAR(UPPER(LTRIM(RTRIM("+sourceUserColumn+"))))) ||&apos;"+vHashDelimeter+"&apos;||");
                }

            }
        }
    }

    var HKeyData1 = HKeyData.toString();
    
    HKeyData1 = HKeyData1.substring(0, HKeyData1.length()-18);

    var HDiffData1 = HDiffData.toString();
    
    HDiffData1 = HDiffData1.substring(0, HDiffData1.length()-18);

    sourceTableName = "SC_"+sourceTable.substring(sourceTable.indexOf(".")+1);

    targetTableName = "SC_"+targetTable.substring(targetTable.indexOf(".")+1);

    


    sqSrc.append("        <TRANSFORMATION DESCRIPTION =\"\" NAME =\"SQ_"+sourceTableName+"\" OBJECTVERSION =\"1\" REUSABLE =\"NO\" TYPE =\"Source Qualifier\" VERSIONNUMBER =\"1\"> \n");
    sqTgt.append("        <TRANSFORMATION DESCRIPTION =\"\" NAME =\"SQ_"+targetTableName+"\" OBJECTVERSION =\"1\" REUSABLE =\"NO\" TYPE =\"Source Qualifier\" VERSIONNUMBER =\"1\"> \n");
    expT.append("        <TRANSFORMATION DESCRIPTION =\"\" NAME =\"EXP_SRC\" OBJECTVERSION =\"1\" REUSABLE =\"NO\" TYPE =\"Expression\" VERSIONNUMBER =\"1\"> \n");
    expTgt.append("        <TRANSFORMATION DESCRIPTION =\"\" NAME =\"EXP_TGT\" OBJECTVERSION =\"1\" REUSABLE =\"NO\" TYPE =\"Expression\" VERSIONNUMBER =\"1\"> \n");
    expT1.append("        <TRANSFORMATION DESCRIPTION =\"\" NAME =\"EXP_JOIN\" OBJECTVERSION =\"1\" REUSABLE =\"NO\" TYPE =\"Expression\" VERSIONNUMBER =\"1\"> \n");
    jnrT.append("        <TRANSFORMATION DESCRIPTION =\"\" NAME =\"JNR_SRC_VS_TGT\" OBJECTVERSION =\"1\" REUSABLE =\"NO\" TYPE =\"Joiner\" VERSIONNUMBER =\"1\"> \n");
    filT.append("        <TRANSFORMATION DESCRIPTION =\"\" NAME =\"FILTRANS\" OBJECTVERSION =\"1\" REUSABLE =\"NO\" TYPE =\"Filter\" VERSIONNUMBER =\"1\"> \n");

    /**New Code**/
    srtT.append("        <TRANSFORMATION DESCRIPTION =\"\" NAME =\"SRT_SRC\" OBJECTVERSION =\"1\" REUSABLE =\"NO\" TYPE =\"Sorter\" VERSIONNUMBER =\"1\"> \n");
    expI.append("        <TRANSFORMATION DESCRIPTION =\"\" NAME =\"EXP_INSERT\" OBJECTVERSION =\"1\" REUSABLE =\"NO\" TYPE =\"Expression\" VERSIONNUMBER =\"1\"> \n");
    expU.append("        <TRANSFORMATION DESCRIPTION =\"\" NAME =\"EXP_UPDATE\" OBJECTVERSION =\"1\" REUSABLE =\"NO\" TYPE =\"Expression\" VERSIONNUMBER =\"1\"> \n");
    expD.append("        <TRANSFORMATION DESCRIPTION =\"\" NAME =\"EXP_DELETE\" OBJECTVERSION =\"1\" REUSABLE =\"NO\" TYPE =\"Expression\" VERSIONNUMBER =\"1\"> \n");
    uni.append("        <TRANSFORMATION COMPONENTVERSION =\"1000000\" DESCRIPTION =\"\" NAME =\"UNI_INS_UPD_DEL\" OBJECTVERSION =\"1\" REUSABLE =\"NO\" TEMPLATEID =\"303001\" TEMPLATENAME =\"Union Transformation\" TYPE =\"Custom Transformation\" VERSIONNUMBER =\"2\"> \n");
    uni.append("            <GROUP DESCRIPTION =\"\" NAME =\"OUTPUT\" ORDER =\"1\" TYPE =\"OUTPUT\"/> \n");
    uni.append("            <GROUP DESCRIPTION =\"\" NAME =\"INSERT\" ORDER =\"2\" TYPE =\"INPUT\"/> \n");
    uni.append("            <GROUP DESCRIPTION =\"\" NAME =\"UPDATE\" ORDER =\"3\" TYPE =\"INPUT\"/> \n");
    uni.append("            <GROUP DESCRIPTION =\"\" NAME =\"DELETE\" ORDER =\"4\" TYPE =\"INPUT\"/> \n");
    updStg.append("        <TRANSFORMATION DESCRIPTION =\"\" NAME =\"UPD_INSERT\" OBJECTVERSION =\"1\" REUSABLE =\"NO\" TYPE =\"Update Strategy\" VERSIONNUMBER =\"1\"> \n");
    rtr.append("        <TRANSFORMATION DESCRIPTION =\"\" NAME =\"RTR_INS_UPD_DEL\" OBJECTVERSION =\"1\" REUSABLE =\"NO\" TYPE =\"Router\" VERSIONNUMBER =\"1\"> \n");
    rtr.append("            <GROUP DESCRIPTION =\"\" EXPRESSION =\"INS_STRATEGY = &apos;INSERT&apos;\" NAME =\"INSERT\" ORDER =\"2\" TYPE =\"OUTPUT\"/> \n");
    rtr.append("            <GROUP DESCRIPTION =\"\" NAME =\"DEFAULT1\" ORDER =\"5\" TYPE =\"OUTPUT/DEFAULT\"/> \n");
    rtr.append("            <GROUP DESCRIPTION =\"\" EXPRESSION =\"UPD_STRATEGY = &apos;UPDATE&apos;\" NAME =\"UPDATE\" ORDER =\"3\" TYPE =\"OUTPUT\"/> \n");
    rtr.append("            <GROUP DESCRIPTION =\"\" NAME =\"INPUT\" ORDER =\"1\" TYPE =\"INPUT\"/> \n");
    rtr.append("            <GROUP DESCRIPTION =\"\" EXPRESSION =\"DEL_STRATEGY = &apos;DELETE&apos;\" NAME =\"DELETE\" ORDER =\"4\" TYPE =\"OUTPUT\"/> \n");





    /** Iterate over the mapping specifications to get the fields information */
    for (var j=0;j<tfrms.size();
         j++)
        if (tfrms.get(j).getInputColumns().size()>0) {
            if (!tfrms.get(j).getInputColumns().get(0).getParentTable().getCompleteName().equals("SYS")) {

                if (!tfrms.get(j).getInputColumns().get(0).getParentTable().getCompleteName().equals("")) {

                    sourceColumnName = tfrms.get(j).getInputColumns().get(0).getColumnName();

                    srcTgtCol = tfrms.get(j).getOutputColumns().get(0).getColumnName();

                    srcDataType = tfrms.get(j).getInputColumns().get(0).getDataType();

                    srcDataLength = tfrms.get(j).getInputColumns().get(0).getLength();

                    srcDataPrecision = tfrms.get(j).getInputColumns().get(0).getPrecision();

                    srcDataScale = tfrms.get(j).getInputColumns().get(0).getScale();


                    if (srcDataType.equalsIgnoreCase("number") && srcDataLength.equals("0")){
                        srcDataType = "decimal";
                        srcDataLength = "4";
                        srcDataPrecision = "4";

                    }

                    if (srcDataType.equalsIgnoreCase("LONGVARCHAR")){
                        srcDataType = "VARCHAR";
                        srcDataLength = "255";
                        srcDataPrecision = "255";

                    }

                    if (srcDataType.equalsIgnoreCase("BYTEINT")){
                        srcDataType = "integer";
                        srcDataLength = "10";
                        srcDataPrecision = "10";

                    }

                    if (srcDataType.equalsIgnoreCase("DATE") || srcDataType.equalsIgnoreCase("DATETIME")){
                        srcDataType = "DATE";
                        srcDataLength = "29";
                        srcDataPrecision = "29";
                        srcDataScale = "9";
                    }

                    if (srcDataType.toUpperCase().contains("TIMESTAMP")){
                        srcDataType = "TIMESTAMP";
                        srcDataLength = "29";
                        srcDataPrecision = "29";
                        srcDataScale = "9";
                    }


                    if ("BKEY".equals(tfrms.get(j).getOutputColumns().get(0).getColumnClass())){
                        sBKey=tfrms.get(j).getInputColumns().get(0).getColumnName();
                    }

                    if (srcDataType.equalsIgnoreCase("varchar") || srcDataType.equalsIgnoreCase("varchar2") || srcDataType.equalsIgnoreCase("char") || srcDataType.equalsIgnoreCase("LONGVARCHAR")){
                        srcDataTypeFormat = "string";
                    }
                    else if (srcDataType.toUpperCase().contains("TIMESTAMP") || srcDataType.equalsIgnoreCase("date") || srcDataType.equalsIgnoreCase("datetime")){
                        srcDataTypeFormat = "date/time";

                    }
                    else if (srcDataType.equalsIgnoreCase("number(p,s)")){
                        srcDataTypeFormat = "decimal";
                    }
                    else if (srcDataType.equalsIgnoreCase("number") || srcDataType.equalsIgnoreCase("BYTEINT")){
                        srcDataTypeFormat = "integer";
                    }
                    else if (srcDataType.equalsIgnoreCase("byte")){
                        srcDataTypeFormat = "binary";
                    }
                    else   {
                        srcDataTypeFormat = srcDataType;
                    }

                }




                sqSrc.append("            <TRANSFORMFIELD DATATYPE =\""+srcDataTypeFormat+"\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" NAME =\""+sourceColumnName+"\" PICTURETEXT =\"\" PORTTYPE =\"INPUT/OUTPUT\" PRECISION =\""+srcDataPrecision+"\" SCALE =\""+srcDataScale+"\"/>  \n");
                conctSqSrc.append("        <CONNECTOR FROMFIELD =\""+sourceColumnName+"\" FROMINSTANCE =\""+sourceTableName+"\" FROMINSTANCETYPE =\"Source Definition\" TOFIELD =\""+sourceColumnName+"\" TOINSTANCE =\"SQ_"+sourceTableName+"\" TOINSTANCETYPE =\"Source Qualifier\"/> \n");
                conctSqSrc.append("        <CONNECTOR FROMFIELD =\""+sourceColumnName+"\" FROMINSTANCE =\"SQ_"+sourceTableName+"\" FROMINSTANCETYPE =\"Source Qualifier\" TOFIELD =\""+srcTgtCol+"\" TOINSTANCE =\"EXP_SRC\" TOINSTANCETYPE =\"Expression\"/> \n");

            }

        }



    for (var n=0;n<tfrms.size();
         n++)
        if (tfrms.get(n).getOutputColumns().size()>0) {

            if (!tfrms.get(n).getOutputColumns().get(0).getParentTable().getCompleteName().equals("SYS1")) {
                if (!tfrms.get(n).getOutputColumns().get(0).getParentTable().getCompleteName().equals("")) {


                    targetColumnName = tfrms.get(n).getOutputColumns().get(0).getColumnName();
                    tgtDataType = tfrms.get(n).getOutputColumns().get(0).getDataType();

                    tgtDataLength = tfrms.get(n).getOutputColumns().get(0).getLength();

                    tgtDataPrecision = tfrms.get(n).getOutputColumns().get(0).getPrecision();

                    tgtDataScale = tfrms.get(n).getOutputColumns().get(0).getScale();

                    tgtColCls = tfrms.get(n).getOutputColumns().get(0).getColumnClass();


                    if (tgtDataType.equalsIgnoreCase("number") && tgtDataLength.equals("0")){
                        tgtDataType = "decimal";
                        tgtDataLength = "4";
                        tgtDataPrecision = "4";

                    }

                    if (tgtDataType.equalsIgnoreCase("LONGVARCHAR")){
                        tgtDataType = "VARCHAR";
                        tgtDataLength = "255";
                        tgtDataPrecision = "255";

                    }


                    if (tgtDataType.equalsIgnoreCase("BYTEINT")){
                        tgtDataType = "integer";
                        tgtDataLength = "10";
                        tgtDataPrecision = "10";

                    }


                    if (tgtDataType.equalsIgnoreCase("DATE") || tgtDataType.equalsIgnoreCase("DATETIME")){
                        tgtDataType = "DATE";
                        tgtDataLength = "29";
                        tgtDataPrecision = "29";
                        tgtDataScale = "9";
                    }


                    if (tgtDataType.toUpperCase().contains("TIMESTAMP")){
                        tgtDataType = "TIMESTAMP";
                        tgtDataLength = "29";
                        tgtDataPrecision = "29";
                        tgtDataScale = "9";
                    }


                    /** It will check for Record Source Field */
                    if ("RSRC".equals(tfrms.get(n).getOutputColumns().get(0).getColumnClass()) && tfrms.get(n).getBussinessRule().equals("")){
                        STG_RSRC_VAL = "'"+vSourceSystem+"'";
                    }

                    else   {
                        STG_RSRC_VAL = tfrms.get(n).getBussinessRule();

                    }
                    /** It will check for Hash Key Field */
                    if ("HKEY".equals(tfrms.get(n).getOutputColumns().get(0).getColumnClass())){
                        md5HK=tfrms.get(n).getOutputColumns().get(0).getColumnName();
                    }

                    if ("HDIFF".equals(tfrms.get(n).getOutputColumns().get(0).getColumnClass())){
                        md5HDiff=tfrms.get(n).getOutputColumns().get(0).getColumnName();
                    }
                    
                     if ("BKEY".equals(tfrms.get(n).getOutputColumns().get(0).getColumnClass())){
                        tBKey=tfrms.get(n).getOutputColumns().get(0).getColumnName();
                    }



                    /** It will generates the port type for Expression fields */
                    if(tgtColCls.equalsIgnoreCase("BKEY") || tgtColCls.equalsIgnoreCase("USER") ){
                        portType = "INPUT/OUTPUT";

                    }
                    else{
                        portType = "OUTPUT";
                    }
                    
                    
                    
                    /** It will creates expression values for Expression Fields */
                    if(tgtColCls.equalsIgnoreCase("HKEY")){

                        expValue= "MD5("+HKeyData1+")";

                    }

                    else if(tgtColCls.equalsIgnoreCase("HDIFF")){

                        expValue= "MD5("+HDiffData1+")";

                    }
                    else if(tgtColCls.equalsIgnoreCase("LDTS")){

                        expValue= vLoadTimeStamp;

                    }
                    else if(tgtColCls.equalsIgnoreCase("RSRC")){

                        expValue= STG_RSRC_VAL;

                    }
                    else if(targetColumnName.contains("CR_JOB")){

                        expValue= vCRJob;

                    }
                    else if(targetColumnName.contains("LOAD_ID")){

                        expValue= vLoadId;

                    }

                    else {
                        expValue = targetColumnName;
                    }





                    if (tgtDataType.equalsIgnoreCase("varchar") || tgtDataType.equalsIgnoreCase("varchar2") || tgtDataType.equalsIgnoreCase("char") || tgtDataType.equalsIgnoreCase("LONGVARCHAR")){
                        tgtDataTypeFormat = "string";
                    }
                    else if (tgtDataType.toUpperCase().contains("TIMESTAMP")|| tgtDataType.equalsIgnoreCase("date") || tgtDataType.equalsIgnoreCase("datetime")){
                        tgtDataTypeFormat = "date/time";
                    }
                    else if (tgtDataType.equalsIgnoreCase("number(p,s)")){
                        tgtDataTypeFormat = "decimal";
                    }
                    else if (tgtDataType.equalsIgnoreCase("number") || tgtDataType.equalsIgnoreCase("BYTEINT")){
                        tgtDataTypeFormat = "integer";
                    }
                    else if (tgtDataType.equalsIgnoreCase("byte")){
                        tgtDataTypeFormat = "binary";
                    }
                    else   {
                        tgtDataTypeFormat = tgtDataType;
                    }
                    
                    
                    if(tgtColCls.equalsIgnoreCase("HKEY")){
                        sortKey= "YES";
                    }
                    else { sortKey= "NO";}
                    
                    
                    if(tgtColCls.equalsIgnoreCase("HKEY") || tgtColCls.equalsIgnoreCase("HDIFF") ){
                        srcExpDataType = "string";

                    }
                    else{
                        srcExpDataType = tgtDataTypeFormat;
                    }
                    



                }
                
                if(!tgtColCls.equalsIgnoreCase("LDTS") && !tgtColCls.equalsIgnoreCase("RSRC") && !tgtColCls.equalsIgnoreCase("")){
                if(tgtColCls.equalsIgnoreCase("HKEY") || tgtColCls.equalsIgnoreCase("HDIFF")){
                sqTgt.append("            <TRANSFORMFIELD DATATYPE =\""+tgtDataTypeFormat+"\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" NAME =\""+targetColumnName+"\" PICTURETEXT =\"\" PORTTYPE =\"INPUT/OUTPUT\" PRECISION =\""+tgtDataPrecision+"\" SCALE =\""+tgtDataScale+"\"/>  \n");
                expTgt.append("            <TRANSFORMFIELD DATATYPE =\""+tgtDataTypeFormat+"\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" EXPRESSION =\""+targetColumnName+"\" EXPRESSIONTYPE =\"GENERAL\" NAME =\"TGT_"+targetColumnName+"\" PICTURETEXT =\"\" PORTTYPE =\"INPUT/OUTPUT\" PRECISION =\""+tgtDataPrecision+"\" SCALE =\""+tgtDataScale+"\"/> \n");
                conctSqTgt.append("        <CONNECTOR FROMFIELD =\""+targetColumnName+"\" FROMINSTANCE =\""+targetTableName+"\" FROMINSTANCETYPE =\"Source Definition\" TOFIELD =\""+targetColumnName+"\" TOINSTANCE =\"SQ_"+targetTableName+"\" TOINSTANCETYPE =\"Source Qualifier\"/> \n");
                conctExpTgt.append("        <CONNECTOR FROMFIELD =\""+targetColumnName+"\" FROMINSTANCE =\"SQ_"+targetTableName+"\" FROMINSTANCETYPE =\"Source Qualifier\" TOFIELD =\"TGT_"+targetColumnName+"\" TOINSTANCE =\"EXP_TGT\" TOINSTANCETYPE =\"Expression\"/> \n");
                conctSqTgt.append("        <CONNECTOR FROMFIELD =\"TGT_"+targetColumnName+"\" FROMINSTANCE =\"EXP_TGT\" FROMINSTANCETYPE =\"Expression\" TOFIELD =\"TGT_"+targetColumnName+"\" TOINSTANCE =\"JNR_SRC_VS_TGT\" TOINSTANCETYPE =\"Joiner\"/> \n");
                }    
                expT.append("            <TRANSFORMFIELD DATATYPE =\""+srcExpDataType+"\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" EXPRESSION =\""+expValue+"\" EXPRESSIONTYPE =\"GENERAL\" NAME =\""+targetColumnName+"\" PICTURETEXT =\"\" PORTTYPE =\""+portType+"\" PRECISION =\""+tgtDataPrecision+"\" SCALE =\""+tgtDataScale+"\"/> \n");
                expT1.append("            <TRANSFORMFIELD DATATYPE =\""+tgtDataTypeFormat+"\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" EXPRESSION =\""+targetColumnName+"\" EXPRESSIONTYPE =\"GENERAL\" NAME =\""+targetColumnName+"\" PICTURETEXT =\"\" PORTTYPE =\"INPUT/OUTPUT\" PRECISION =\""+tgtDataPrecision+"\" SCALE =\""+tgtDataScale+"\"/> \n");
                jnrT.append("            <TRANSFORMFIELD DATATYPE =\""+tgtDataTypeFormat+"\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" NAME =\""+targetColumnName+"\" PICTURETEXT =\"\" PORTTYPE =\"INPUT/OUTPUT\" PRECISION =\""+tgtDataPrecision+"\" SCALE =\""+tgtDataScale+"\"/>  \n");
                filT.append("            <TRANSFORMFIELD DATATYPE =\""+tgtDataTypeFormat+"\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" NAME =\""+targetColumnName+"\" PICTURETEXT =\"\" PORTTYPE =\"INPUT/OUTPUT\" PRECISION =\""+tgtDataPrecision+"\" SCALE =\""+tgtDataScale+"\"/>  \n");
                
                conctUpd.append("        <CONNECTOR FROMFIELD =\""+targetColumnName+"\" FROMINSTANCE =\"UPD_INSERT\" FROMINSTANCETYPE =\"Update Strategy\" TOFIELD =\""+targetColumnName+"\" TOINSTANCE =\""+targetTableName+"_INS"+"\" TOINSTANCETYPE =\"Target Definition\"/> \n");
                
                if(!tgtColCls.equalsIgnoreCase("HKEY") && !tgtColCls.equalsIgnoreCase("HDIFF")){
                conctExpT.append("        <CONNECTOR FROMFIELD =\""+targetColumnName+"\" FROMINSTANCE =\"EXP_SRC\" FROMINSTANCETYPE =\"Expression\" TOFIELD =\""+targetColumnName+"\" TOINSTANCE =\"SRT_SRC\" TOINSTANCETYPE =\"Sorter\"/> \n");
                }
                conctSrt.append("        <CONNECTOR FROMFIELD =\""+targetColumnName+"\" FROMINSTANCE =\"SRT_SRC\" FROMINSTANCETYPE =\"Sorter\" TOFIELD =\""+targetColumnName+"\" TOINSTANCE =\"JNR_SRC_VS_TGT\" TOINSTANCETYPE =\"Joiner\"/> \n");
                conctJnrT.append("        <CONNECTOR FROMFIELD =\""+targetColumnName+"\" FROMINSTANCE =\"JNR_SRC_VS_TGT\" FROMINSTANCETYPE =\"Joiner\" TOFIELD =\""+targetColumnName+"\" TOINSTANCE =\"EXP_JOIN\" TOINSTANCETYPE =\"Expression\"/> \n");
                conctExpT1.append("        <CONNECTOR FROMFIELD =\""+targetColumnName+"\" FROMINSTANCE =\"EXP_JOIN\" FROMINSTANCETYPE =\"Expression\" TOFIELD =\""+targetColumnName+"\" TOINSTANCE =\"RTR_INS_UPD_DEL\" TOINSTANCETYPE =\"Router\"/> \n");
                conctRtr.append("        <CONNECTOR FROMFIELD =\""+targetColumnName+"1\" FROMINSTANCE =\"RTR_INS_UPD_DEL\" FROMINSTANCETYPE =\"Router\" TOFIELD =\""+targetColumnName+"\" TOINSTANCE =\"EXP_INSERT\" TOINSTANCETYPE =\"Expression\"/> \n");
                conctRtr.append("        <CONNECTOR FROMFIELD =\""+targetColumnName+"4\" FROMINSTANCE =\"RTR_INS_UPD_DEL\" FROMINSTANCETYPE =\"Router\" TOFIELD =\""+targetColumnName+"\" TOINSTANCE =\"EXP_DELETE\" TOINSTANCETYPE =\"Expression\"/> \n");
                conctRtr.append("        <CONNECTOR FROMFIELD =\""+targetColumnName+"3\" FROMINSTANCE =\"RTR_INS_UPD_DEL\" FROMINSTANCETYPE =\"Router\" TOFIELD =\""+targetColumnName+"\" TOINSTANCE =\"EXP_UPDATE\" TOINSTANCETYPE =\"Expression\"/> \n");
                conctUpI.append("        <CONNECTOR FROMFIELD =\""+targetColumnName+"\" FROMINSTANCE =\"EXP_INSERT\" FROMINSTANCETYPE =\"Expression\" TOFIELD =\""+targetColumnName+"1\" TOINSTANCE =\"UNI_INS_UPD_DEL\" TOINSTANCETYPE =\"Custom Transformation\"/> \n");
                conctUpU.append("        <CONNECTOR FROMFIELD =\""+targetColumnName+"\" FROMINSTANCE =\"EXP_UPDATE\" FROMINSTANCETYPE =\"Expression\" TOFIELD =\""+targetColumnName+"2\" TOINSTANCE =\"UNI_INS_UPD_DEL\" TOINSTANCETYPE =\"Custom Transformation\"/> \n");
                conctUpDl.append("        <CONNECTOR FROMFIELD =\""+targetColumnName+"\" FROMINSTANCE =\"EXP_DELETE\" FROMINSTANCETYPE =\"Expression\" TOFIELD =\""+targetColumnName+"3\" TOINSTANCE =\"UNI_INS_UPD_DEL\" TOINSTANCETYPE =\"Custom Transformation\"/> \n");
                conctUnion.append("        <CONNECTOR FROMFIELD =\""+targetColumnName+"\" FROMINSTANCE =\"UNI_INS_UPD_DEL\" FROMINSTANCETYPE =\"Custom Transformation\" TOFIELD =\""+targetColumnName+"\" TOINSTANCE =\"UPD_INSERT\" TOINSTANCETYPE =\"Update Strategy\"/> \n");
               
                // New Code
                
                srtT.append("            <TRANSFORMFIELD DATATYPE =\""+tgtDataTypeFormat+"\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" ISSORTKEY =\""+sortKey+"\" NAME =\""+targetColumnName+"\" PICTURETEXT =\"\" PORTTYPE =\"INPUT/OUTPUT\" PRECISION =\""+tgtDataPrecision+"\" SCALE =\""+tgtDataScale+"\" SORTDIRECTION =\"ASCENDING\"/> \n");
                expI.append("            <TRANSFORMFIELD DATATYPE =\""+tgtDataTypeFormat+"\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" EXPRESSION =\""+targetColumnName+"\" EXPRESSIONTYPE =\"GENERAL\" NAME =\""+targetColumnName+"\" PICTURETEXT =\"\" PORTTYPE =\"INPUT/OUTPUT\" PRECISION =\""+tgtDataPrecision+"\" SCALE =\""+tgtDataScale+"\"/> \n");
                expU.append("            <TRANSFORMFIELD DATATYPE =\""+tgtDataTypeFormat+"\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" EXPRESSION =\""+targetColumnName+"\" EXPRESSIONTYPE =\"GENERAL\" NAME =\""+targetColumnName+"\" PICTURETEXT =\"\" PORTTYPE =\"INPUT/OUTPUT\" PRECISION =\""+tgtDataPrecision+"\" SCALE =\""+tgtDataScale+"\"/> \n");
                expD.append("            <TRANSFORMFIELD DATATYPE =\""+tgtDataTypeFormat+"\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" EXPRESSION =\""+targetColumnName+"\" EXPRESSIONTYPE =\"GENERAL\" NAME =\""+targetColumnName+"\" PICTURETEXT =\"\" PORTTYPE =\"INPUT/OUTPUT\" PRECISION =\""+tgtDataPrecision+"\" SCALE =\""+tgtDataScale+"\"/> \n");
                rtr.append("            <TRANSFORMFIELD DATATYPE =\""+tgtDataTypeFormat+"\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" GROUP =\"INPUT\" NAME =\""+targetColumnName+"\" PICTURETEXT =\"\" PORTTYPE =\"INPUT\" PRECISION =\""+tgtDataPrecision+"\" SCALE =\""+tgtDataScale+"\"/> \n");
                rtr1.append("            <TRANSFORMFIELD DATATYPE =\""+tgtDataTypeFormat+"\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" GROUP =\"INSERT\" NAME =\""+targetColumnName+"1\" PICTURETEXT =\"\" PORTTYPE =\"OUTPUT\" PRECISION =\""+tgtDataPrecision+"\" REF_FIELD =\""+targetColumnName+"\" SCALE =\""+tgtDataScale+"\"/> \n");
                rtr2.append("            <TRANSFORMFIELD DATATYPE =\""+tgtDataTypeFormat+"\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" GROUP =\"UPDATE\" NAME =\""+targetColumnName+"3\" PICTURETEXT =\"\" PORTTYPE =\"OUTPUT\" PRECISION =\""+tgtDataPrecision+"\" REF_FIELD =\""+targetColumnName+"\" SCALE =\""+tgtDataScale+"\"/> \n");
                rtr3.append("            <TRANSFORMFIELD DATATYPE =\""+tgtDataTypeFormat+"\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" GROUP =\"DELETE\" NAME =\""+targetColumnName+"4\" PICTURETEXT =\"\" PORTTYPE =\"OUTPUT\" PRECISION =\""+tgtDataPrecision+"\" REF_FIELD =\""+targetColumnName+"\" SCALE =\""+tgtDataScale+"\"/> \n");
                rtr4.append("            <TRANSFORMFIELD DATATYPE =\""+tgtDataTypeFormat+"\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" GROUP =\"DEFAULT1\" NAME =\""+targetColumnName+"2\" PICTURETEXT =\"\" PORTTYPE =\"OUTPUT\" PRECISION =\""+tgtDataPrecision+"\" REF_FIELD =\""+targetColumnName+"\" SCALE =\""+tgtDataScale+"\"/> \n");
                
                updStg.append("            <TRANSFORMFIELD DATATYPE =\""+tgtDataTypeFormat+"\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" NAME =\""+targetColumnName+"\" PICTURETEXT =\"\" PORTTYPE =\"INPUT/OUTPUT\" PRECISION =\""+tgtDataPrecision+"\" SCALE =\""+tgtDataScale+"\"/> \n");
                uni.append("            <TRANSFORMFIELD DATATYPE =\""+tgtDataTypeFormat+"\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" GROUP =\"OUTPUT\" NAME =\""+targetColumnName+"\" OUTPUTGROUP =\"OUTPUT\" PICTURETEXT =\"\" PORTTYPE =\"OUTPUT\" PRECISION =\""+tgtDataPrecision+"\" SCALE =\""+tgtDataScale+"\"/> \n");
                uni1.append("             <TRANSFORMFIELD DATATYPE =\""+tgtDataTypeFormat+"\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" GROUP =\"INSERT\" NAME =\""+targetColumnName+"1\" OUTPUTGROUP =\"INSERT\" PICTURETEXT =\"\" PORTTYPE =\"INPUT\" PRECISION =\""+tgtDataPrecision+"\" SCALE =\""+tgtDataScale+"\"/>\n");
                uni2.append("            <TRANSFORMFIELD DATATYPE =\""+tgtDataTypeFormat+"\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" GROUP =\"UPDATE\" NAME =\""+targetColumnName+"2\" OUTPUTGROUP =\"UPDATE\" PICTURETEXT =\"\" PORTTYPE =\"INPUT\" PRECISION =\""+tgtDataPrecision+"\" SCALE =\""+tgtDataScale+"\"/> \n");
                uni3.append("            <TRANSFORMFIELD DATATYPE =\""+tgtDataTypeFormat+"\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" GROUP =\"DELETE\" NAME =\""+targetColumnName+"3\" OUTPUTGROUP =\"DELETE\" PICTURETEXT =\"\" PORTTYPE =\"INPUT\" PRECISION =\""+tgtDataPrecision+"\" SCALE =\""+tgtDataScale+"\"/> \n");
                fldDpnd.append("            <FIELDDEPENDENCY INPUTFIELD =\""+targetColumnName+"1\" OUTPUTFIELD =\""+targetColumnName+"\"/> \n");
                fldDpnd.append("            <FIELDDEPENDENCY INPUTFIELD =\""+targetColumnName+"2\" OUTPUTFIELD =\""+targetColumnName+"\"/> \n");
                fldDpnd.append("            <FIELDDEPENDENCY INPUTFIELD =\""+targetColumnName+"3\" OUTPUTFIELD =\""+targetColumnName+"\"/> \n");
                
                }
            }
        }
    /** It will creates Transformation Table attributes for Source Qualifier, Expression, Joiner, Filter */
    
    sqTgt.append("            <TABLEATTRIBUTE NAME =\"Sql Query\" VALUE =\"\"/> \n");
    sqTgt.append("            <TABLEATTRIBUTE NAME =\"User Defined Join\" VALUE =\"\"/>\n");
    sqTgt.append("            <TABLEATTRIBUTE NAME =\"Source Filter\" VALUE =\"\"/>\n");
    sqTgt.append("            <TABLEATTRIBUTE NAME =\"Number Of Sorted Ports\" VALUE =\"0\"/>\n");
    sqTgt.append("            <TABLEATTRIBUTE NAME =\"Tracing Level\" VALUE =\"Normal\"/>\n");
    sqTgt.append("            <TABLEATTRIBUTE NAME =\"Select Distinct\" VALUE =\"NO\"/>\n");
    sqTgt.append("            <TABLEATTRIBUTE NAME =\"Is Partitionable\" VALUE =\"NO\"/>\n");
    sqTgt.append("            <TABLEATTRIBUTE NAME =\"Pre SQL\" VALUE =\"\"/>\n");
    sqTgt.append("            <TABLEATTRIBUTE NAME =\"Post SQL\" VALUE =\"\"/>\n");
    sqTgt.append("            <TABLEATTRIBUTE NAME =\"Output is deterministic\" VALUE =\"NO\"/>\n");
    sqTgt.append("            <TABLEATTRIBUTE NAME =\"Output is repeatable\" VALUE =\"Never\"/>\n");
    sqTgt.append("        </TRANSFORMATION>\n");
    
    rtr.append("            <TRANSFORMFIELD DATATYPE =\"string\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" GROUP =\"INPUT\" NAME =\"INS_STRATEGY\" PICTURETEXT =\"\" PORTTYPE =\"INPUT\" PRECISION =\"10\" SCALE =\"0\"/> \n");
    rtr.append("            <TRANSFORMFIELD DATATYPE =\"string\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" GROUP =\"INPUT\" NAME =\"UPD_STRATEGY\" PICTURETEXT =\"\" PORTTYPE =\"INPUT\" PRECISION =\"10\" SCALE =\"0\"/> \n");
    rtr.append("            <TRANSFORMFIELD DATATYPE =\"string\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" GROUP =\"INPUT\" NAME =\"DEL_STRATEGY\" PICTURETEXT =\"\" PORTTYPE =\"INPUT\" PRECISION =\"10\" SCALE =\"0\"/> \n");
    rtr.append("            <TRANSFORMFIELD DATATYPE =\"integer\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" GROUP =\"INPUT\" NAME =\"DWH_LOAD_ID\" PICTURETEXT =\"\" PORTTYPE =\"INPUT\" PRECISION =\"10\" SCALE =\"0\"/> \n");
    rtr.append("            <TRANSFORMFIELD DATATYPE =\"string\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" GROUP =\"INPUT\" NAME =\"DWH_JOB\" PICTURETEXT =\"\" PORTTYPE =\"INPUT\" PRECISION =\"100\" SCALE =\"0\"/> \n");
    //--------------------------//
    rtr1.append("            <TRANSFORMFIELD DATATYPE =\"string\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" GROUP =\"INSERT\" NAME =\"INS_STRATEGY1\" PICTURETEXT =\"\" PORTTYPE =\"OUTPUT\" PRECISION =\"10\" REF_FIELD =\"INS_STRATEGY\" SCALE =\"0\"/> \n");
    rtr1.append("            <TRANSFORMFIELD DATATYPE =\"string\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" GROUP =\"INSERT\" NAME =\"UPD_STRATEGY1\" PICTURETEXT =\"\" PORTTYPE =\"OUTPUT\" PRECISION =\"10\" REF_FIELD =\"UPD_STRATEGY\" SCALE =\"0\"/> \n");
    rtr1.append("            <TRANSFORMFIELD DATATYPE =\"string\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" GROUP =\"INSERT\" NAME =\"DEL_STRATEGY1\" PICTURETEXT =\"\" PORTTYPE =\"OUTPUT\" PRECISION =\"10\" REF_FIELD =\"DEL_STRATEGY\" SCALE =\"0\"/> \n");
    rtr1.append("            <TRANSFORMFIELD DATATYPE =\"integer\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" GROUP =\"INSERT\" NAME =\"DWH_LOAD_ID1\" PICTURETEXT =\"\" PORTTYPE =\"OUTPUT\" PRECISION =\"10\" REF_FIELD =\"DWH_LOAD_ID\" SCALE =\"0\"/> \n");
    rtr1.append("            <TRANSFORMFIELD DATATYPE =\"string\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" GROUP =\"INSERT\" NAME =\"DWH_JOB1\" PICTURETEXT =\"\" PORTTYPE =\"OUTPUT\" PRECISION =\"100\" REF_FIELD =\"DWH_JOB\" SCALE =\"0\"/> \n");
    
    rtr2.append("            <TRANSFORMFIELD DATATYPE =\"string\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" GROUP =\"UPDATE\" NAME =\"INS_STRATEGY3\" PICTURETEXT =\"\" PORTTYPE =\"OUTPUT\" PRECISION =\"10\" REF_FIELD =\"INS_STRATEGY\" SCALE =\"0\"/> \n");
    rtr2.append("            <TRANSFORMFIELD DATATYPE =\"string\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" GROUP =\"UPDATE\" NAME =\"UPD_STRATEGY3\" PICTURETEXT =\"\" PORTTYPE =\"OUTPUT\" PRECISION =\"10\" REF_FIELD =\"UPD_STRATEGY\" SCALE =\"0\"/> \n");
    rtr2.append("            <TRANSFORMFIELD DATATYPE =\"string\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" GROUP =\"UPDATE\" NAME =\"DEL_STRATEGY3\" PICTURETEXT =\"\" PORTTYPE =\"OUTPUT\" PRECISION =\"10\" REF_FIELD =\"DEL_STRATEGY\" SCALE =\"0\"/> \n");
    rtr2.append("            <TRANSFORMFIELD DATATYPE =\"integer\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" GROUP =\"UPDATE\" NAME =\"DWH_LOAD_ID3\" PICTURETEXT =\"\" PORTTYPE =\"OUTPUT\" PRECISION =\"10\" REF_FIELD =\"DWH_LOAD_ID\" SCALE =\"0\"/> \n");
    rtr2.append("            <TRANSFORMFIELD DATATYPE =\"string\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" GROUP =\"UPDATE\" NAME =\"DWH_JOB3\" PICTURETEXT =\"\" PORTTYPE =\"OUTPUT\" PRECISION =\"100\" REF_FIELD =\"DWH_JOB\" SCALE =\"0\"/> \n");
    
    rtr3.append("            <TRANSFORMFIELD DATATYPE =\"string\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" GROUP =\"DELETE\" NAME =\"INS_STRATEGY4\" PICTURETEXT =\"\" PORTTYPE =\"OUTPUT\" PRECISION =\"10\" REF_FIELD =\"INS_STRATEGY\" SCALE =\"0\"/> \n");
    rtr3.append("            <TRANSFORMFIELD DATATYPE =\"string\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" GROUP =\"DELETE\" NAME =\"UPD_STRATEGY4\" PICTURETEXT =\"\" PORTTYPE =\"OUTPUT\" PRECISION =\"10\" REF_FIELD =\"UPD_STRATEGY\" SCALE =\"0\"/> \n");
    rtr3.append("            <TRANSFORMFIELD DATATYPE =\"string\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" GROUP =\"DELETE\" NAME =\"DEL_STRATEGY4\" PICTURETEXT =\"\" PORTTYPE =\"OUTPUT\" PRECISION =\"10\" REF_FIELD =\"DEL_STRATEGY\" SCALE =\"0\"/> \n");
    rtr3.append("            <TRANSFORMFIELD DATATYPE =\"integer\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" GROUP =\"DELETE\" NAME =\"DWH_LOAD_ID4\" PICTURETEXT =\"\" PORTTYPE =\"OUTPUT\" PRECISION =\"10\" REF_FIELD =\"DWH_LOAD_ID\" SCALE =\"0\"/> \n");
    rtr3.append("            <TRANSFORMFIELD DATATYPE =\"string\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" GROUP =\"DELETE\" NAME =\"DWH_JOB4\" PICTURETEXT =\"\" PORTTYPE =\"OUTPUT\" PRECISION =\"100\" REF_FIELD =\"DWH_JOB\" SCALE =\"0\"/> \n");
    
    rtr4.append("            <TRANSFORMFIELD DATATYPE =\"string\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" GROUP =\"DEFAULT1\" NAME =\"INS_STRATEGY2\" PICTURETEXT =\"\" PORTTYPE =\"OUTPUT\" PRECISION =\"10\" REF_FIELD =\"INS_STRATEGY\" SCALE =\"0\"/> \n");
    rtr4.append("            <TRANSFORMFIELD DATATYPE =\"string\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" GROUP =\"DEFAULT1\" NAME =\"UPD_STRATEGY2\" PICTURETEXT =\"\" PORTTYPE =\"OUTPUT\" PRECISION =\"10\" REF_FIELD =\"UPD_STRATEGY\" SCALE =\"0\"/> \n");
    rtr4.append("            <TRANSFORMFIELD DATATYPE =\"string\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" GROUP =\"DEFAULT1\" NAME =\"DEL_STRATEGY2\" PICTURETEXT =\"\" PORTTYPE =\"OUTPUT\" PRECISION =\"10\" REF_FIELD =\"DEL_STRATEGY\" SCALE =\"0\"/> \n");
    rtr4.append("            <TRANSFORMFIELD DATATYPE =\"integer\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" GROUP =\"DEFAULT1\" NAME =\"DWH_LOAD_ID2\" PICTURETEXT =\"\" PORTTYPE =\"OUTPUT\" PRECISION =\"10\" REF_FIELD =\"DWH_LOAD_ID\" SCALE =\"0\"/> \n");
    rtr4.append("            <TRANSFORMFIELD DATATYPE =\"string\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" GROUP =\"DEFAULT1\" NAME =\"DWH_JOB2\" PICTURETEXT =\"\" PORTTYPE =\"OUTPUT\" PRECISION =\"100\" REF_FIELD =\"DWH_JOB\" SCALE =\"0\"/> \n");
    
    uni.append("            <TRANSFORMFIELD DATATYPE =\"integer\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" GROUP =\"OUTPUT\" NAME =\"DWH_LOAD_ID\" OUTPUTGROUP =\"OUTPUT\" PICTURETEXT =\"\" PORTTYPE =\"OUTPUT\" PRECISION =\"10\" SCALE =\"0\"/> \n");
    uni.append("            <TRANSFORMFIELD DATATYPE =\"string\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" GROUP =\"OUTPUT\" NAME =\"DWH_JOB\" OUTPUTGROUP =\"OUTPUT\" PICTURETEXT =\"\" PORTTYPE =\"OUTPUT\" PRECISION =\"100\" SCALE =\"0\"/> \n");
    uni.append("            <TRANSFORMFIELD DATATYPE =\"date/time\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" GROUP =\"OUTPUT\" NAME =\"PDIL_LOAD_TIMESTAMP\" OUTPUTGROUP =\"OUTPUT\" PICTURETEXT =\"\" PORTTYPE =\"OUTPUT\" PRECISION =\"29\" SCALE =\"9\"/> \n");
    uni.append("            <TRANSFORMFIELD DATATYPE =\"string\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" GROUP =\"OUTPUT\" NAME =\"PDIL_SOURCE_SYSTEM\" OUTPUTGROUP =\"OUTPUT\" PICTURETEXT =\"\" PORTTYPE =\"OUTPUT\" PRECISION =\"20\" SCALE =\"0\"/> \n");
               
    uni1.append("            <TRANSFORMFIELD DATATYPE =\"integer\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" GROUP =\"INSERT\" NAME =\"DWH_LOAD_ID1\" OUTPUTGROUP =\"INSERT\" PICTURETEXT =\"\" PORTTYPE =\"INPUT\" PRECISION =\"10\" SCALE =\"0\"/> \n");
    uni1.append("            <TRANSFORMFIELD DATATYPE =\"string\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" GROUP =\"INSERT\" NAME =\"DWH_JOB1\" OUTPUTGROUP =\"INSERT\" PICTURETEXT =\"\" PORTTYPE =\"INPUT\" PRECISION =\"100\" SCALE =\"0\"/> \n");
    uni1.append("            <TRANSFORMFIELD DATATYPE =\"date/time\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" GROUP =\"INSERT\" NAME =\"PDIL_LOAD_TIMESTAMP1\" OUTPUTGROUP =\"INSERT\" PICTURETEXT =\"\" PORTTYPE =\"INPUT\" PRECISION =\"29\" SCALE =\"9\"/> \n");
    uni1.append("            <TRANSFORMFIELD DATATYPE =\"string\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" GROUP =\"INSERT\" NAME =\"PDIL_SOURCE_SYSTEM1\" OUTPUTGROUP =\"INSERT\" PICTURETEXT =\"\" PORTTYPE =\"INPUT\" PRECISION =\"20\" SCALE =\"0\"/> \n");
    
    uni2.append("            <TRANSFORMFIELD DATATYPE =\"integer\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" GROUP =\"UPDATE\" NAME =\"DWH_LOAD_ID2\" OUTPUTGROUP =\"UPDATE\" PICTURETEXT =\"\" PORTTYPE =\"INPUT\" PRECISION =\"10\" SCALE =\"0\"/> \n");
    uni2.append("            <TRANSFORMFIELD DATATYPE =\"string\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" GROUP =\"UPDATE\" NAME =\"DWH_JOB2\" OUTPUTGROUP =\"UPDATE\" PICTURETEXT =\"\" PORTTYPE =\"INPUT\" PRECISION =\"100\" SCALE =\"0\"/> \n");
    uni2.append("            <TRANSFORMFIELD DATATYPE =\"date/time\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" GROUP =\"UPDATE\" NAME =\"PDIL_LOAD_TIMESTAMP2\" OUTPUTGROUP =\"UPDATE\" PICTURETEXT =\"\" PORTTYPE =\"INPUT\" PRECISION =\"29\" SCALE =\"9\"/>\n");
    uni2.append("            <TRANSFORMFIELD DATATYPE =\"string\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" GROUP =\"UPDATE\" NAME =\"PDIL_SOURCE_SYSTEM2\" OUTPUTGROUP =\"UPDATE\" PICTURETEXT =\"\" PORTTYPE =\"INPUT\" PRECISION =\"20\" SCALE =\"0\"/> \n");
    
    uni3.append("            <TRANSFORMFIELD DATATYPE =\"integer\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" GROUP =\"DELETE\" NAME =\"DWH_LOAD_ID3\" OUTPUTGROUP =\"DELETE\" PICTURETEXT =\"\" PORTTYPE =\"INPUT\" PRECISION =\"10\" SCALE =\"0\"/> \n");
    uni3.append("            <TRANSFORMFIELD DATATYPE =\"string\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" GROUP =\"DELETE\" NAME =\"DWH_JOB3\" OUTPUTGROUP =\"DELETE\" PICTURETEXT =\"\" PORTTYPE =\"INPUT\" PRECISION =\"100\" SCALE =\"0\"/> \n");
    uni3.append("            <TRANSFORMFIELD DATATYPE =\"date/time\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" GROUP =\"DELETE\" NAME =\"PDIL_LOAD_TIMESTAMP3\" OUTPUTGROUP =\"DELETE\" PICTURETEXT =\"\" PORTTYPE =\"INPUT\" PRECISION =\"29\" SCALE =\"9\"/> \n");
    uni3.append("            <TRANSFORMFIELD DATATYPE =\"string\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" GROUP =\"DELETE\" NAME =\"PDIL_SOURCE_SYSTEM3\" OUTPUTGROUP =\"DELETE\" PICTURETEXT =\"\" PORTTYPE =\"INPUT\" PRECISION =\"20\" SCALE =\"0\"/> \n");
    
    updStg.append("            <TRANSFORMFIELD DATATYPE =\"string\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" NAME =\"PDIL_CR_JOB\" PICTURETEXT =\"\" PORTTYPE =\"INPUT/OUTPUT\" PRECISION =\"100\" SCALE =\"0\"/> \n");
    updStg.append("            <TRANSFORMFIELD DATATYPE =\"integer\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" NAME =\"PDIL_CR_LOAD_ID\" PICTURETEXT =\"\" PORTTYPE =\"INPUT/OUTPUT\" PRECISION =\"10\" SCALE =\"0\"/> \n");
    updStg.append("            <TRANSFORMFIELD DATATYPE =\"date/time\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" NAME =\"PDIL_LOAD_TIMESTAMP\" PICTURETEXT =\"\" PORTTYPE =\"INPUT/OUTPUT\" PRECISION =\"29\" SCALE =\"9\"/> \n");
    updStg.append("            <TRANSFORMFIELD DATATYPE =\"string\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" NAME =\"PDIL_SOURCE_SYSTEM\" PICTURETEXT =\"\" PORTTYPE =\"INPUT/OUTPUT\" PRECISION =\"20\" SCALE =\"0\"/> \n");
    
    
    rtr.append(rtr1);
    rtr.append(rtr2);
    rtr.append(rtr3);
    rtr.append(rtr4);
    
    uni.append(uni1);
    uni.append(uni2);
    uni.append(uni3);
    

    sqSrc.append("            <TABLEATTRIBUTE NAME =\"Sql Query\" VALUE =\"\"/> \n");
    sqSrc.append("            <TABLEATTRIBUTE NAME =\"User Defined Join\" VALUE =\"\"/>\n");
    sqSrc.append("            <TABLEATTRIBUTE NAME =\"Source Filter\" VALUE =\"\"/>\n");
    sqSrc.append("            <TABLEATTRIBUTE NAME =\"Number Of Sorted Ports\" VALUE =\"0\"/>\n");
    sqSrc.append("            <TABLEATTRIBUTE NAME =\"Tracing Level\" VALUE =\"Normal\"/>\n");
    sqSrc.append("            <TABLEATTRIBUTE NAME =\"Select Distinct\" VALUE =\"NO\"/>\n");
    sqSrc.append("            <TABLEATTRIBUTE NAME =\"Is Partitionable\" VALUE =\"NO\"/>\n");
    sqSrc.append("            <TABLEATTRIBUTE NAME =\"Pre SQL\" VALUE =\"\"/>\n");
    sqSrc.append("            <TABLEATTRIBUTE NAME =\"Post SQL\" VALUE =\"\"/>\n");
    sqSrc.append("            <TABLEATTRIBUTE NAME =\"Output is deterministic\" VALUE =\"NO\"/>\n");
    sqSrc.append("            <TABLEATTRIBUTE NAME =\"Output is repeatable\" VALUE =\"Never\"/>\n");
    sqSrc.append("        </TRANSFORMATION>\n");

    exp.append("            <TABLEATTRIBUTE NAME =\"Tracing Level\" VALUE =\"Normal\"/> \n");
    exp.append("        </TRANSFORMATION>\n");
    
    expT1.append("            <TRANSFORMFIELD DATATYPE =\"binary\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" EXPRESSION =\"TGT_PDIL_HK\" EXPRESSIONTYPE =\"GENERAL\" NAME =\"TGT_PDIL_HK\" PICTURETEXT =\"\" PORTTYPE =\"INPUT/OUTPUT\" PRECISION =\"16\" SCALE =\"0\"/> \n");
    expT1.append("            <TRANSFORMFIELD DATATYPE =\"binary\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" EXPRESSION =\"TGT_PDIL_HASH_DIFF\" EXPRESSIONTYPE =\"GENERAL\" NAME =\"TGT_PDIL_HASH_DIFF\" PICTURETEXT =\"\" PORTTYPE =\"INPUT/OUTPUT\" PRECISION =\"16\" SCALE =\"0\"/> \n");
    expT1.append("            <TRANSFORMFIELD DATATYPE =\"string\" DEFAULTVALUE =\"ERROR(&apos;transformation error&apos;)\" DESCRIPTION =\"\" EXPRESSION =\"IIF(&#xD;&#xA;ISNULL(TGT_PDIL_HK) = TRUE,&#xD;&#xA;&apos;INSERT&apos;, &apos;NO ACTION&apos;&#xD;&#xA;)\" EXPRESSIONTYPE =\"GENERAL\" NAME =\"INS_STRATEGY\" PICTURETEXT =\"\" PORTTYPE =\"OUTPUT\" PRECISION =\"10\" SCALE =\"0\"/> \n");
    expT1.append("            <TRANSFORMFIELD DATATYPE =\"string\" DEFAULTVALUE =\"ERROR(&apos;transformation error&apos;)\" DESCRIPTION =\"\" EXPRESSION =\"IIF(&#xD;&#xA;PDIL_IS_ACTIVE=1 AND&#xD;&#xA;ISNULL(TGT_PDIL_HK) = FALSE AND&#xD;&#xA;ENC_BASE64(PDIL_HASH_DIFF) != ENC_BASE64(TGT_PDIL_HASH_DIFF),&#xD;&#xA;&apos;UPDATE&apos;, &apos;NO ACTION&apos;&#xD;&#xA;)\" EXPRESSIONTYPE =\"GENERAL\" NAME =\"UPD_STRATEGY\" PICTURETEXT =\"\" PORTTYPE =\"OUTPUT\" PRECISION =\"10\" SCALE =\"0\"/> \n");
    expT1.append("            <TRANSFORMFIELD DATATYPE =\"string\" DEFAULTVALUE =\"ERROR(&apos;transformation error&apos;)\" DESCRIPTION =\"\" EXPRESSION =\"IIF(&#xD;&#xA;PDIL_IS_ACTIVE=0 AND&#xD;&#xA;ISNULL(TGT_PDIL_HK) = FALSE AND&#xD;&#xA;ENC_BASE64(PDIL_HASH_DIFF) != ENC_BASE64(TGT_PDIL_HASH_DIFF),&#xD;&#xA;&apos;DELETE&apos;, &apos;NO ACTION&apos;&#xD;&#xA;)\" EXPRESSIONTYPE =\"GENERAL\" NAME =\"DEL_STRATEGY\" PICTURETEXT =\"\" PORTTYPE =\"OUTPUT\" PRECISION =\"10\" SCALE =\"0\"/> \n");
    expT1.append("            <TRANSFORMFIELD DATATYPE =\"integer\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" EXPRESSION =\"DWH_LOAD_ID\" EXPRESSIONTYPE =\"GENERAL\" NAME =\"DWH_LOAD_ID\" PICTURETEXT =\"\" PORTTYPE =\"INPUT/OUTPUT\" PRECISION =\"10\" SCALE =\"0\"/> \n");
    expT1.append("            <TRANSFORMFIELD DATATYPE =\"string\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" EXPRESSION =\"DWH_JOB\" EXPRESSIONTYPE =\"GENERAL\" NAME =\"DWH_JOB\" PICTURETEXT =\"\" PORTTYPE =\"INPUT/OUTPUT\" PRECISION =\"100\" SCALE =\"0\"/> \n");
    
    expC.append("            <TRANSFORMFIELD DATATYPE =\"integer\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" EXPRESSION =\"DWH_LOAD_ID\" EXPRESSIONTYPE =\"GENERAL\" NAME =\"DWH_LOAD_ID\" PICTURETEXT =\"\" PORTTYPE =\"INPUT/OUTPUT\" PRECISION =\"10\" SCALE =\"0\"/> \n");
    expC.append("            <TRANSFORMFIELD DATATYPE =\"string\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" EXPRESSION =\"DWH_JOB\" EXPRESSIONTYPE =\"GENERAL\" NAME =\"DWH_JOB\" PICTURETEXT =\"\" PORTTYPE =\"INPUT/OUTPUT\" PRECISION =\"100\" SCALE =\"0\"/> \n");
    expC.append("            <TRANSFORMFIELD DATATYPE =\"date/time\" DEFAULTVALUE =\"ERROR(&apos;transformation error&apos;)\" DESCRIPTION =\"\" EXPRESSION =\""+vLoadTimeStamp+"\" EXPRESSIONTYPE =\"GENERAL\" NAME =\"PDIL_LOAD_TIMESTAMP\" PICTURETEXT =\"\" PORTTYPE =\"OUTPUT\" PRECISION =\"29\" SCALE =\"9\"/> \n");
    expC.append("            <TRANSFORMFIELD DATATYPE =\"string\" DEFAULTVALUE =\"ERROR(&apos;transformation error&apos;)\" DESCRIPTION =\"\" EXPRESSION =\"&apos;"+vSourceSystem+"&apos;\" EXPRESSIONTYPE =\"GENERAL\" NAME =\"PDIL_SOURCE_SYSTEM\" PICTURETEXT =\"\" PORTTYPE =\"OUTPUT\" PRECISION =\"20\" SCALE =\"0\"/> \n");
    expI.append(expC);
    expI.append("            <TRANSFORMFIELD DATATYPE =\"integer\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" EXPRESSION =\"SETCOUNTVARIABLE($$INSERT)=$$INSERT+1\" EXPRESSIONTYPE =\"GENERAL\" NAME =\"INS_COUNT\" PICTURETEXT =\"\" PORTTYPE =\"LOCAL VARIABLE\" PRECISION =\"10\" SCALE =\"0\"/> \n");
    
    expU.append(expC);
    expU.append("            <TRANSFORMFIELD DATATYPE =\"integer\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" EXPRESSION =\"SETCOUNTVARIABLE($$UPDATE)=$$UPDATE+1\" EXPRESSIONTYPE =\"GENERAL\" NAME =\"UPD_COUNT\" PICTURETEXT =\"\" PORTTYPE =\"LOCAL VARIABLE\" PRECISION =\"10\" SCALE =\"0\"/> \n");
    
    expD.append(expC);
    expD.append("            <TRANSFORMFIELD DATATYPE =\"integer\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" EXPRESSION =\"SETCOUNTVARIABLE($$DELETE)=$$DELETE+1\" EXPRESSIONTYPE =\"GENERAL\" NAME =\"DEL_COUNT\" PICTURETEXT =\"\" PORTTYPE =\"LOCAL VARIABLE\" PRECISION =\"10\" SCALE =\"0\"/> \n");

    expT1.append(exp);
    expT.append(exp);
    expI.append(exp);
    expU.append(exp);
    expD.append(exp);
    expTgt.append(exp);
    rtr.append(exp);




    jnrT.append("            <TRANSFORMFIELD DATATYPE =\"binary\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" NAME =\"TGT_"+md5HK+"\" PICTURETEXT =\"\" PORTTYPE =\"INPUT/OUTPUT/MASTER\" PRECISION =\"16\" SCALE =\"0\"/> \n");
    jnrT.append("            <TRANSFORMFIELD DATATYPE =\"binary\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" NAME =\"TGT_"+md5HDiff+"\" PICTURETEXT =\"\" PORTTYPE =\"INPUT/OUTPUT/MASTER\" PRECISION =\"16\" SCALE =\"0\"/> \n");
    jnrT.append("            <TABLEATTRIBUTE NAME =\"Case Sensitive String Comparison\" VALUE =\"YES\"/> \n");
    jnrT.append("            <TABLEATTRIBUTE NAME =\"Cache Directory\" VALUE =\"$PMCacheDir\"/> \n");
    jnrT.append("            <TABLEATTRIBUTE NAME =\"Join Condition\" VALUE =\"TGT_"+md5HK+" = "+md5HK+"\"/> \n");
    jnrT.append("            <TABLEATTRIBUTE NAME =\"Join Type\" VALUE =\"Master Outer Join\"/> \n");
    jnrT.append("            <TABLEATTRIBUTE NAME =\"Null ordering in master\" VALUE =\"Null Is Highest Value\"/> \n");
    jnrT.append("            <TABLEATTRIBUTE NAME =\"Null ordering in detail\" VALUE =\"Null Is Highest Value\"/> \n");
    jnrT.append("            <TABLEATTRIBUTE NAME =\"Tracing Level\" VALUE =\"Normal\"/> \n");
    jnrT.append("            <TABLEATTRIBUTE NAME =\"Joiner Data Cache Size\" VALUE =\"Auto\"/> \n");
    jnrT.append("            <TABLEATTRIBUTE NAME =\"Joiner Index Cache Size\" VALUE =\"Auto\"/> \n");
    jnrT.append("            <TABLEATTRIBUTE NAME =\"Sorted Input\" VALUE =\"NO\"/> \n");
    jnrT.append("            <TABLEATTRIBUTE NAME =\"Master Sort Order\" VALUE =\"Auto\"/> \n");
    jnrT.append("            <TABLEATTRIBUTE NAME =\"Transformation Scope\" VALUE =\"All Input\"/> \n");
    jnrT.append("        </TRANSFORMATION> \n");


    srtT.append("            <TABLEATTRIBUTE NAME =\"Sorter Cache Size\" VALUE =\"Auto\"/> \n");
    srtT.append("            <TABLEATTRIBUTE NAME =\"Case Sensitive\" VALUE =\"YES\"/>\n");
    srtT.append("            <TABLEATTRIBUTE NAME =\"Work Directory\" VALUE =\"$PMTempDir\"/> \n");
    srtT.append("            <TABLEATTRIBUTE NAME =\"Distinct\" VALUE =\"NO\"/> \n");
    srtT.append("            <TABLEATTRIBUTE NAME =\"Tracing Level\" VALUE =\"Normal\"/> \n");
    srtT.append("            <TABLEATTRIBUTE NAME =\"Null Treated Low\" VALUE =\"NO\"/> \n");
    srtT.append("            <TABLEATTRIBUTE NAME =\"Merge Only\" VALUE =\"NO\"/> \n");
    srtT.append("            <TABLEATTRIBUTE NAME =\"Partitioning\" VALUE =\"Order records for individual partitions\"/> \n");
    srtT.append("            <TABLEATTRIBUTE NAME =\"Transformation Scope\" VALUE =\"All Input\"/> \n");

    srtT.append("        </TRANSFORMATION> \n");

    uni.append("            <TABLEATTRIBUTE NAME =\"Language\" VALUE =\"C\"/> \n            <TABLEATTRIBUTE NAME =\"Module Identifier\" VALUE =\"pmuniontrans\"/> \n            <TABLEATTRIBUTE NAME =\"Class Name\" VALUE =\"\"/> \n            <TABLEATTRIBUTE NAME =\"Function Identifier\" VALUE =\"pmunionfunc\"/> \n            <TABLEATTRIBUTE NAME =\"Runtime Location\" VALUE =\"\"/> \n            <TABLEATTRIBUTE NAME =\"Tracing Level\" VALUE =\"Normal\"/> \n            <TABLEATTRIBUTE NAME =\"Is Partitionable\" VALUE =\"Across Grid\"/> \n            <TABLEATTRIBUTE NAME =\"Inputs Must Block\" VALUE =\"NO\"/> \n");
    uni.append("            <TABLEATTRIBUTE NAME =\"Is Active\" VALUE =\"YES\"/> \n            <TABLEATTRIBUTE NAME =\"Update Strategy Transformation\" VALUE =\"NO\"/> \n            <TABLEATTRIBUTE NAME =\"Transformation Scope\" VALUE =\"Row\"/> \n            <TABLEATTRIBUTE NAME =\"Generate Transaction\" VALUE =\"NO\"/> \n            <TABLEATTRIBUTE NAME =\"Output Is Repeatable\" VALUE =\"Never\"/> \n            <TABLEATTRIBUTE NAME =\"Requires Single Thread Per Partition\" VALUE =\"NO\"/> \n            <TABLEATTRIBUTE NAME =\"Output Is Deterministic\" VALUE =\"YES\"/> \n            <TABLEATTRIBUTE NAME =\"Preserves Data Set Boundary\" VALUE =\"No\"/> \n");
    uni.append("            <INITPROP DESCRIPTION =\"\" NAME =\"Programmatic Identifier for Class Factory\" USERDEFINED =\"NO\" VALUE =\"\"/> \n            <INITPROP DESCRIPTION =\"\" NAME =\"Constructor\" USERDEFINED =\"NO\" VALUE =\"\"/> \n");
    uni.append(fldDpnd);
    uni.append("        </TRANSFORMATION> \n");

    updStg.append("            <TABLEATTRIBUTE NAME =\"Update Strategy Expression\" VALUE =\"DD_INSERT\"/> \n");
    updStg.append("            <TABLEATTRIBUTE NAME =\"Forward Rejected Rows\" VALUE =\"YES\"/> \n");
    updStg.append("            <TABLEATTRIBUTE NAME =\"Tracing Level\" VALUE =\"Normal\"/> \n");
    updStg.append("        </TRANSFORMATION> \n");







    /** It will creates Transformations and Connectors */
    inst.append("        <INSTANCE DESCRIPTION =\"\" NAME =\""+targetTableName+"_INS"+"\" TRANSFORMATION_NAME =\""+targetTableName+"\" TRANSFORMATION_TYPE =\"Target Definition\" TYPE =\"TARGET\"/> \n");
    inst.append("        <INSTANCE DESCRIPTION =\"\" NAME =\"SQ_"+sourceTableName+"\" REUSABLE =\"NO\" TRANSFORMATION_NAME =\"SQ_"+sourceTableName+"\" TRANSFORMATION_TYPE =\"Source Qualifier\" TYPE =\"TRANSFORMATION\"> \n");
    inst.append("            <ASSOCIATED_SOURCE_INSTANCE NAME =\""+sourceTableName+"\"/> \n");
    inst.append("        </INSTANCE> \n");
    inst.append("        <INSTANCE DESCRIPTION =\"\" NAME =\"SQ_"+targetTableName+"\" REUSABLE =\"NO\" TRANSFORMATION_NAME =\"SQ_"+targetTableName+"\" TRANSFORMATION_TYPE =\"Source Qualifier\" TYPE =\"TRANSFORMATION\"> \n");
    inst.append("            <ASSOCIATED_SOURCE_INSTANCE NAME =\""+targetTableName+"\"/> \n");
    inst.append("        </INSTANCE> \n");
    inst.append("        <INSTANCE DESCRIPTION =\"\" NAME =\"EXP_SRC\" REUSABLE =\"NO\" TRANSFORMATION_NAME =\"EXP_SRC\" TRANSFORMATION_TYPE =\"Expression\" TYPE =\"TRANSFORMATION\"/> \n");
    inst.append("        <INSTANCE DESCRIPTION =\"\" NAME =\"EXP_TGT\" REUSABLE =\"NO\" TRANSFORMATION_NAME =\"EXP_TGT\" TRANSFORMATION_TYPE =\"Expression\" TYPE =\"TRANSFORMATION\"/> \n");
    inst.append("        <INSTANCE DESCRIPTION =\"\" NAME =\"JNR_SRC_VS_TGT\" REUSABLE =\"NO\" TRANSFORMATION_NAME =\"JNR_SRC_VS_TGT\" TRANSFORMATION_TYPE =\"Joiner\" TYPE =\"TRANSFORMATION\"/> \n");
    inst.append("        <INSTANCE DESCRIPTION =\"\" NAME =\"SRT_SRC\" REUSABLE =\"NO\" TRANSFORMATION_NAME =\"SRT_SRC\" TRANSFORMATION_TYPE =\"Sorter\" TYPE =\"TRANSFORMATION\"/> \n");
    inst.append("        <INSTANCE DESCRIPTION =\"\" NAME =\"EXP_JOIN\" REUSABLE =\"NO\" TRANSFORMATION_NAME =\"EXP_JOIN\" TRANSFORMATION_TYPE =\"Expression\" TYPE =\"TRANSFORMATION\"/> \n");
    inst.append("        <INSTANCE DESCRIPTION =\"\" NAME =\"RTR_INS_UPD_DEL\" REUSABLE =\"NO\" TRANSFORMATION_NAME =\"RTR_INS_UPD_DEL\" TRANSFORMATION_TYPE =\"Router\" TYPE =\"TRANSFORMATION\"/> \n");
    inst.append("        <INSTANCE DESCRIPTION =\"\" NAME =\"EXP_INSERT\" REUSABLE =\"NO\" TRANSFORMATION_NAME =\"EXP_INSERT\" TRANSFORMATION_TYPE =\"Expression\" TYPE =\"TRANSFORMATION\"/> \n");
    inst.append("        <INSTANCE DESCRIPTION =\"\" NAME =\"EXP_UPDATE\" REUSABLE =\"NO\" TRANSFORMATION_NAME =\"EXP_UPDATE\" TRANSFORMATION_TYPE =\"Expression\" TYPE =\"TRANSFORMATION\"/> \n");
    inst.append("        <INSTANCE DESCRIPTION =\"\" NAME =\"EXP_DELETE\" REUSABLE =\"NO\" TRANSFORMATION_NAME =\"EXP_DELETE\" TRANSFORMATION_TYPE =\"Expression\" TYPE =\"TRANSFORMATION\"/> \n");
    inst.append("        <INSTANCE DESCRIPTION =\"\" NAME =\"UNI_INS_UPD_DEL\" REUSABLE =\"NO\" TRANSFORMATION_NAME =\"UNI_INS_UPD_DEL\" TRANSFORMATION_TYPE =\"Custom Transformation\" TYPE =\"TRANSFORMATION\"/> \n");
    inst.append("        <INSTANCE DESCRIPTION =\"\" NAME =\"UPD_INSERT\" REUSABLE =\"NO\" TRANSFORMATION_NAME =\"UPD_INSERT\" TRANSFORMATION_TYPE =\"Update Strategy\" TYPE =\"TRANSFORMATION\"/> \n");
    inst.append("        <INSTANCE DESCRIPTION =\"\" NAME =\"SC_exp_SET_DWH_COLUMNS\" REUSABLE =\"YES\" TRANSFORMATION_NAME =\"SC_exp_SET_DWH_COLUMNS\" TRANSFORMATION_TYPE =\"Expression\" TYPE =\"TRANSFORMATION\"/> \n");
    inst.append("        <INSTANCE DESCRIPTION =\"\" NAME =\"Java_Convert_MD5ToBinary\" REUSABLE =\"YES\" TRANSFORMATION_NAME =\"Java_Convert_MD5ToBinary\" TRANSFORMATION_TYPE =\"Custom Transformation\" TYPE =\"TRANSFORMATION\"/> \n");
    inst.append("        <INSTANCE DESCRIPTION =\"\" NAME =\"Java_Convert_MD5ToBinary1\" REUSABLE =\"YES\" TRANSFORMATION_NAME =\"Java_Convert_MD5ToBinary\" TRANSFORMATION_TYPE =\"Custom Transformation\" TYPE =\"TRANSFORMATION\"/> \n");

    inst.append("        <INSTANCE DBDNAME =\""+vSourceDB+"\" DESCRIPTION =\"\" NAME =\""+sourceTableName+"\" TRANSFORMATION_NAME =\""+sourceTableName+"\" TRANSFORMATION_TYPE =\"Source Definition\" TYPE =\"SOURCE\"/> \n");
    inst.append("        <INSTANCE DBDNAME =\""+vSourceDB+"\" DESCRIPTION =\"\" NAME =\""+targetTableName+"\" TRANSFORMATION_NAME =\""+targetTableName+"\" TRANSFORMATION_TYPE =\"Source Definition\" TYPE =\"SOURCE\"/> \n");


    conctRtr.append("        <CONNECTOR FROMFIELD =\"DWH_LOAD_ID1\" FROMINSTANCE =\"RTR_INS_UPD_DEL\" FROMINSTANCETYPE =\"Router\" TOFIELD =\"DWH_LOAD_ID\" TOINSTANCE =\"EXP_INSERT\" TOINSTANCETYPE =\"Expression\"/> \n");
    conctRtr.append("        <CONNECTOR FROMFIELD =\"DWH_JOB1\" FROMINSTANCE =\"RTR_INS_UPD_DEL\" FROMINSTANCETYPE =\"Router\" TOFIELD =\"DWH_JOB\" TOINSTANCE =\"EXP_INSERT\" TOINSTANCETYPE =\"Expression\"/> \n");
    conctRtr.append("        <CONNECTOR FROMFIELD =\"DWH_LOAD_ID3\" FROMINSTANCE =\"RTR_INS_UPD_DEL\" FROMINSTANCETYPE =\"Router\" TOFIELD =\"DWH_LOAD_ID\" TOINSTANCE =\"EXP_UPDATE\" TOINSTANCETYPE =\"Expression\"/> \n");
    conctRtr.append("        <CONNECTOR FROMFIELD =\"DWH_JOB3\" FROMINSTANCE =\"RTR_INS_UPD_DEL\" FROMINSTANCETYPE =\"Router\" TOFIELD =\"DWH_JOB\" TOINSTANCE =\"EXP_UPDATE\" TOINSTANCETYPE =\"Expression\"/> \n");
    conctRtr.append("        <CONNECTOR FROMFIELD =\"DWH_LOAD_ID4\" FROMINSTANCE =\"RTR_INS_UPD_DEL\" FROMINSTANCETYPE =\"Router\" TOFIELD =\"DWH_LOAD_ID\" TOINSTANCE =\"EXP_DELETE\" TOINSTANCETYPE =\"Expression\"/> \n");
    conctRtr.append("        <CONNECTOR FROMFIELD =\"DWH_JOB4\" FROMINSTANCE =\"RTR_INS_UPD_DEL\" FROMINSTANCETYPE =\"Router\" TOFIELD =\"DWH_JOB\" TOINSTANCE =\"EXP_DELETE\" TOINSTANCETYPE =\"Expression\"/> \n");
    
    conctExpT1.append("        <CONNECTOR FROMFIELD =\"INS_STRATEGY\" FROMINSTANCE =\"EXP_JOIN\" FROMINSTANCETYPE =\"Expression\" TOFIELD =\"INS_STRATEGY\" TOINSTANCE =\"RTR_INS_UPD_DEL\" TOINSTANCETYPE =\"Router\"/> \n");
    conctExpT1.append("        <CONNECTOR FROMFIELD =\"UPD_STRATEGY\" FROMINSTANCE =\"EXP_JOIN\" FROMINSTANCETYPE =\"Expression\" TOFIELD =\"UPD_STRATEGY\" TOINSTANCE =\"RTR_INS_UPD_DEL\" TOINSTANCETYPE =\"Router\"/> \n");
    conctExpT1.append("        <CONNECTOR FROMFIELD =\"DWH_LOAD_ID\" FROMINSTANCE =\"EXP_JOIN\" FROMINSTANCETYPE =\"Expression\" TOFIELD =\"DWH_LOAD_ID\" TOINSTANCE =\"RTR_INS_UPD_DEL\" TOINSTANCETYPE =\"Router\"/> \n");
    conctExpT1.append("        <CONNECTOR FROMFIELD =\"DWH_JOB\" FROMINSTANCE =\"EXP_JOIN\" FROMINSTANCETYPE =\"Expression\" TOFIELD =\"DWH_JOB\" TOINSTANCE =\"RTR_INS_UPD_DEL\" TOINSTANCETYPE =\"Router\"/> \n");
    conctExpT1.append("        <CONNECTOR FROMFIELD =\"DEL_STRATEGY\" FROMINSTANCE =\"EXP_JOIN\" FROMINSTANCETYPE =\"Expression\" TOFIELD =\"DEL_STRATEGY\" TOINSTANCE =\"RTR_INS_UPD_DEL\" TOINSTANCETYPE =\"Router\"/> \n");
    
    
    conctJav.append("        <CONNECTOR FROMFIELD =\""+tBKey+"\" FROMINSTANCE =\"JNR_SRC_VS_TGT\" FROMINSTANCETYPE =\"Joiner\" TOFIELD =\"IN_FIELD_CHAR\" TOINSTANCE =\"SC_exp_SET_DWH_COLUMNS\" TOINSTANCETYPE =\"Expression\"/> \n");
    conctJav.append("        <CONNECTOR FROMFIELD =\"DWH_LOAD_ID\" FROMINSTANCE =\"SC_exp_SET_DWH_COLUMNS\" FROMINSTANCETYPE =\"Expression\" TOFIELD =\"DWH_LOAD_ID\" TOINSTANCE =\"EXP_JOIN\" TOINSTANCETYPE =\"Expression\"/> \n");
    conctJav.append("        <CONNECTOR FROMFIELD =\"DWH_JOB\" FROMINSTANCE =\"SC_exp_SET_DWH_COLUMNS\" FROMINSTANCETYPE =\"Expression\" TOFIELD =\"DWH_JOB\" TOINSTANCE =\"EXP_JOIN\" TOINSTANCETYPE =\"Expression\"/> \n");
    conctJav.append("        <CONNECTOR FROMFIELD =\"PDIL_HK\" FROMINSTANCE =\"EXP_SRC\" FROMINSTANCETYPE =\"Expression\" TOFIELD =\"INPUT\" TOINSTANCE =\"Java_Convert_MD5ToBinary\" TOINSTANCETYPE =\"Custom Transformation\"/> \n");
    conctJav.append("        <CONNECTOR FROMFIELD =\"PDIL_HASH_DIFF\" FROMINSTANCE =\"EXP_SRC\" FROMINSTANCETYPE =\"Expression\" TOFIELD =\"INPUT\" TOINSTANCE =\"Java_Convert_MD5ToBinary1\" TOINSTANCETYPE =\"Custom Transformation\"/> \n");
    conctJav.append("        <CONNECTOR FROMFIELD =\"BINARY_OUTPUT\" FROMINSTANCE =\"Java_Convert_MD5ToBinary\" FROMINSTANCETYPE =\"Custom Transformation\" TOFIELD =\"PDIL_HK\" TOINSTANCE =\"SRT_SRC\" TOINSTANCETYPE =\"Sorter\"/> \n");
    conctJav.append("        <CONNECTOR FROMFIELD =\"BINARY_OUTPUT\" FROMINSTANCE =\"Java_Convert_MD5ToBinary1\" FROMINSTANCETYPE =\"Custom Transformation\" TOFIELD =\"PDIL_HASH_DIFF\" TOINSTANCE =\"SRT_SRC\" TOINSTANCETYPE =\"Sorter\"/> \n");
    
    conctJnrT.append("        <CONNECTOR FROMFIELD =\"TGT_PDIL_HK\" FROMINSTANCE =\"JNR_SRC_VS_TGT\" FROMINSTANCETYPE =\"Joiner\" TOFIELD =\"TGT_PDIL_HK\" TOINSTANCE =\"EXP_JOIN\" TOINSTANCETYPE =\"Expression\"/> \n");
    conctJnrT.append("        <CONNECTOR FROMFIELD =\"TGT_PDIL_HASH_DIFF\" FROMINSTANCE =\"JNR_SRC_VS_TGT\" FROMINSTANCETYPE =\"Joiner\" TOFIELD =\"TGT_PDIL_HASH_DIFF\" TOINSTANCE =\"EXP_JOIN\" TOINSTANCETYPE =\"Expression\"/> \n");
    
    conctUpI.append("        <CONNECTOR FROMFIELD =\"DWH_LOAD_ID\" FROMINSTANCE =\"EXP_INSERT\" FROMINSTANCETYPE =\"Expression\" TOFIELD =\"DWH_LOAD_ID1\" TOINSTANCE =\"UNI_INS_UPD_DEL\" TOINSTANCETYPE =\"Custom Transformation\"/> \n");
    conctUpI.append("        <CONNECTOR FROMFIELD =\"DWH_JOB\" FROMINSTANCE =\"EXP_INSERT\" FROMINSTANCETYPE =\"Expression\" TOFIELD =\"DWH_JOB1\" TOINSTANCE =\"UNI_INS_UPD_DEL\" TOINSTANCETYPE =\"Custom Transformation\"/> \n");
    conctUpI.append("        <CONNECTOR FROMFIELD =\"PDIL_LOAD_TIMESTAMP\" FROMINSTANCE =\"EXP_INSERT\" FROMINSTANCETYPE =\"Expression\" TOFIELD =\"PDIL_LOAD_TIMESTAMP1\" TOINSTANCE =\"UNI_INS_UPD_DEL\" TOINSTANCETYPE =\"Custom Transformation\"/> \n");
    conctUpI.append("        <CONNECTOR FROMFIELD =\"PDIL_SOURCE_SYSTEM\" FROMINSTANCE =\"EXP_INSERT\" FROMINSTANCETYPE =\"Expression\" TOFIELD =\"PDIL_SOURCE_SYSTEM1\" TOINSTANCE =\"UNI_INS_UPD_DEL\" TOINSTANCETYPE =\"Custom Transformation\"/> \n");
    
    conctUpDl.append("        <CONNECTOR FROMFIELD =\"DWH_LOAD_ID\" FROMINSTANCE =\"EXP_DELETE\" FROMINSTANCETYPE =\"Expression\" TOFIELD =\"DWH_LOAD_ID3\" TOINSTANCE =\"UNI_INS_UPD_DEL\" TOINSTANCETYPE =\"Custom Transformation\"/> \n");
    conctUpDl.append("        <CONNECTOR FROMFIELD =\"DWH_JOB\" FROMINSTANCE =\"EXP_DELETE\" FROMINSTANCETYPE =\"Expression\" TOFIELD =\"DWH_JOB3\" TOINSTANCE =\"UNI_INS_UPD_DEL\" TOINSTANCETYPE =\"Custom Transformation\"/> \n");
    conctUpDl.append("        <CONNECTOR FROMFIELD =\"PDIL_LOAD_TIMESTAMP\" FROMINSTANCE =\"EXP_DELETE\" FROMINSTANCETYPE =\"Expression\" TOFIELD =\"PDIL_LOAD_TIMESTAMP3\" TOINSTANCE =\"UNI_INS_UPD_DEL\" TOINSTANCETYPE =\"Custom Transformation\"/> \n");
    conctUpDl.append("        <CONNECTOR FROMFIELD =\"PDIL_SOURCE_SYSTEM\" FROMINSTANCE =\"EXP_DELETE\" FROMINSTANCETYPE =\"Expression\" TOFIELD =\"PDIL_SOURCE_SYSTEM3\" TOINSTANCE =\"UNI_INS_UPD_DEL\" TOINSTANCETYPE =\"Custom Transformation\"/> \n");
    
    conctUpU.append("        <CONNECTOR FROMFIELD =\"DWH_LOAD_ID\" FROMINSTANCE =\"EXP_UPDATE\" FROMINSTANCETYPE =\"Expression\" TOFIELD =\"DWH_LOAD_ID2\" TOINSTANCE =\"UNI_INS_UPD_DEL\" TOINSTANCETYPE =\"Custom Transformation\"/> \n");
    conctUpU.append("        <CONNECTOR FROMFIELD =\"DWH_JOB\" FROMINSTANCE =\"EXP_UPDATE\" FROMINSTANCETYPE =\"Expression\" TOFIELD =\"DWH_JOB2\" TOINSTANCE =\"UNI_INS_UPD_DEL\" TOINSTANCETYPE =\"Custom Transformation\"/> \n");
    conctUpU.append("        <CONNECTOR FROMFIELD =\"PDIL_LOAD_TIMESTAMP\" FROMINSTANCE =\"EXP_UPDATE\" FROMINSTANCETYPE =\"Expression\" TOFIELD =\"PDIL_LOAD_TIMESTAMP2\" TOINSTANCE =\"UNI_INS_UPD_DEL\" TOINSTANCETYPE =\"Custom Transformation\"/> \n");
    conctUpU.append("        <CONNECTOR FROMFIELD =\"PDIL_SOURCE_SYSTEM\" FROMINSTANCE =\"EXP_UPDATE\" FROMINSTANCETYPE =\"Expression\" TOFIELD =\"PDIL_SOURCE_SYSTEM2\" TOINSTANCE =\"UNI_INS_UPD_DEL\" TOINSTANCETYPE =\"Custom Transformation\"/> \n");
    
    
    conctUnion.append("        <CONNECTOR FROMFIELD =\"DWH_JOB\" FROMINSTANCE =\"UNI_INS_UPD_DEL\" FROMINSTANCETYPE =\"Custom Transformation\" TOFIELD =\"PDIL_CR_JOB\" TOINSTANCE =\"UPD_INSERT\" TOINSTANCETYPE =\"Update Strategy\"/> \n");
    conctUnion.append("        <CONNECTOR FROMFIELD =\"DWH_LOAD_ID\" FROMINSTANCE =\"UNI_INS_UPD_DEL\" FROMINSTANCETYPE =\"Custom Transformation\" TOFIELD =\"PDIL_CR_LOAD_ID\" TOINSTANCE =\"UPD_INSERT\" TOINSTANCETYPE =\"Update Strategy\"/> \n");
    conctUnion.append("        <CONNECTOR FROMFIELD =\"PDIL_LOAD_TIMESTAMP\" FROMINSTANCE =\"UNI_INS_UPD_DEL\" FROMINSTANCETYPE =\"Custom Transformation\" TOFIELD =\"PDIL_LOAD_TIMESTAMP\" TOINSTANCE =\"UPD_INSERT\" TOINSTANCETYPE =\"Update Strategy\"/> \n");
    conctUnion.append("        <CONNECTOR FROMFIELD =\"PDIL_SOURCE_SYSTEM\" FROMINSTANCE =\"UNI_INS_UPD_DEL\" FROMINSTANCETYPE =\"Custom Transformation\" TOFIELD =\"PDIL_SOURCE_SYSTEM\" TOINSTANCE =\"UPD_INSERT\" TOINSTANCETYPE =\"Update Strategy\"/> \n");
    
    conctUpd.append("        <CONNECTOR FROMFIELD =\"PDIL_CR_JOB\" FROMINSTANCE =\"UPD_INSERT\" FROMINSTANCETYPE =\"Update Strategy\" TOFIELD =\"PDIL_CR_JOB\" TOINSTANCE =\""+targetTableName+"_INS"+"\" TOINSTANCETYPE =\"Target Definition\"/> \n");
    conctUpd.append("        <CONNECTOR FROMFIELD =\"PDIL_CR_LOAD_ID\" FROMINSTANCE =\"UPD_INSERT\" FROMINSTANCETYPE =\"Update Strategy\" TOFIELD =\"PDIL_CR_LOAD_ID\" TOINSTANCE =\""+targetTableName+"_INS"+"\" TOINSTANCETYPE =\"Target Definition\"/> \n");
    conctUpd.append("        <CONNECTOR FROMFIELD =\"PDIL_LOAD_TIMESTAMP\" FROMINSTANCE =\"UPD_INSERT\" FROMINSTANCETYPE =\"Update Strategy\" TOFIELD =\"PDIL_LOAD_TIMESTAMP\" TOINSTANCE =\""+targetTableName+"_INS"+"\" TOINSTANCETYPE =\"Target Definition\"/> \n");
    conctUpd.append("        <CONNECTOR FROMFIELD =\"PDIL_SOURCE_SYSTEM\" FROMINSTANCE =\"UPD_INSERT\" FROMINSTANCETYPE =\"Update Strategy\" TOFIELD =\"PDIL_SOURCE_SYSTEM\" TOINSTANCE =\""+targetTableName+"_INS"+"\" TOINSTANCETYPE =\"Target Definition\"/> \n");


    mappingDetailsOut.append(sqSrc);
    mappingDetailsOut.append(sqTgt);
    mappingDetailsOut.append(expT);
    mappingDetailsOut.append(expTgt);
    mappingDetailsOut.append(srtT);
    mappingDetailsOut.append(jnrT);
    mappingDetailsOut.append(expT1);
    mappingDetailsOut.append(rtr);
    mappingDetailsOut.append(expI);
    mappingDetailsOut.append(expU);
    mappingDetailsOut.append(expD);
    mappingDetailsOut.append(uni);
    mappingDetailsOut.append(updStg);
    mappingDetailsOut.append(inst);
    mappingDetailsOut.append(conctUpd);
    mappingDetailsOut.append(conctSqSrc);
    mappingDetailsOut.append(conctSrt);
    mappingDetailsOut.append(conctExpT1);
    mappingDetailsOut.append(conctSqTgt);
    mappingDetailsOut.append(conctExpT);
    mappingDetailsOut.append(conctExpTgt);
    mappingDetailsOut.append(conctJnrT);
    mappingDetailsOut.append(conctRtr);
    mappingDetailsOut.append(conctUpI);
    mappingDetailsOut.append(conctUpU);
    mappingDetailsOut.append(conctUpDl);
    mappingDetailsOut.append(conctUnion);
    mappingDetailsOut.append(conctJav);



    mappingDetailsOut.append("        <TARGETLOADORDER ORDER =\"1\" TARGETINSTANCE =\""+targetTableName+"_INS"+"\"/> \n");
    mappingDetailsOut.append("        <MAPPINGVARIABLE AGGFUNCTION =\"COUNT\" DATATYPE =\"integer\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" ISEXPRESSIONVARIABLE =\"NO\" ISPARAM =\"NO\" NAME =\"$$INSERT\" PRECISION =\"10\" SCALE =\"0\" USERDEFINED =\"YES\"/> \n");
    mappingDetailsOut.append("        <MAPPINGVARIABLE AGGFUNCTION =\"COUNT\" DATATYPE =\"integer\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" ISEXPRESSIONVARIABLE =\"NO\" ISPARAM =\"NO\" NAME =\"$$UPDATE\" PRECISION =\"10\" SCALE =\"0\" USERDEFINED =\"YES\"/> \n");
    mappingDetailsOut.append("        <MAPPINGVARIABLE AGGFUNCTION =\"COUNT\" DATATYPE =\"integer\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" ISEXPRESSIONVARIABLE =\"NO\" ISPARAM =\"NO\" NAME =\"$$DELETE\" PRECISION =\"10\" SCALE =\"0\" USERDEFINED =\"YES\"/> \n");
    mappingDetailsOut.append("        <ERPINFO/> \n");
    mappingDetailsOut.append("    </MAPPING> \n");


    var vsourceTableName = sourceTableName.replace("SC_","");
    var vtargetTableName = targetTableName.replace("SC_","");

    mappingDetailsOut.append("    <SHORTCUT COMMENTS =\"\" DBDNAME =\""+vSourceDB+"\" FOLDERNAME =\""+vSharedFolderName+"\" NAME =\""+sourceTableName+"\" OBJECTSUBTYPE =\"Source Definition\" OBJECTTYPE =\"SOURCE\" REFERENCEDDBD =\""+vSourceDB+"\" REFERENCETYPE =\"LOCAL\" REFOBJECTNAME =\""+vsourceTableName+"\" REPOSITORYNAME =\""+vRepo+"\" VERSIONNUMBER =\"1\"/> \n");

    mappingDetailsOut.append("    <SHORTCUT COMMENTS =\"\" DBDNAME =\""+vSourceDB+"\" FOLDERNAME =\""+vSharedFolderName+"\" NAME =\""+targetTableName+"\" OBJECTSUBTYPE =\"Source Definition\" OBJECTTYPE =\"SOURCE\" REFERENCEDDBD =\""+vSourceDB+"\" REFERENCETYPE =\"LOCAL\" REFOBJECTNAME =\""+vtargetTableName+"\" REPOSITORYNAME =\""+vRepo+"\" VERSIONNUMBER =\"1\"/> \n");

    mappingDetailsOut.append("    <SHORTCUT COMMENTS =\"\" FOLDERNAME =\""+vSharedTrans+"\" NAME =\"SC_exp_SET_DWH_COLUMNS\" OBJECTSUBTYPE =\"Expression\" OBJECTTYPE =\"TRANSFORMATION\" REFERENCETYPE =\"LOCAL\" REFOBJECTNAME =\"exp_SET_DWH_COLUMNS\" REPOSITORYNAME =\""+vRepo+"\" VERSIONNUMBER =\"1\"/> \n");

    mappingDetailsOut.append("    <SHORTCUT COMMENTS =\"\" FOLDERNAME =\""+vSharedFolderName+"\" NAME =\""+targetTableName+"\" OBJECTSUBTYPE =\"Target Definition\" OBJECTTYPE =\"TARGET\" REFERENCETYPE =\"LOCAL\" REFOBJECTNAME =\""+vtargetTableName+"\" REPOSITORYNAME =\""+vRepo+"\" VERSIONNUMBER =\"1\"/>\n");



    return mappingDetailsOut;


}
