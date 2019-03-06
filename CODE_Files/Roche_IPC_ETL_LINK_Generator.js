/** 
 * CAT : INFA_DV_LNK_CAT
 * Version : V5.4
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

    var informaticaXmlSb = new java.lang.StringBuffer();
    var mappingVo = vmappingManagerUtil.getMapping(mapping.getMappindId());
    var mapName = mappingVo.getMappingName();

    var validMap1 = validMap();

    if(!validMap1.contains("TRUE")){
     return mapName+"---> This is not a valid LINK mapping";   
    }
    else{

    /** Creates Informatica .xml header */
    informaticaXmlSb.append(CreateHeader());
    /** Creates Informatica .xml Source details */    
    informaticaXmlSb.append(Source());
    /** Creates Informatica .xml Target details */    
    informaticaXmlSb.append(Target());
    /** Creates Informatica .xml Mapping details */    
    informaticaXmlSb.append(MappingDetails());

    informaticaXmlSb.append("</FOLDER> \n");
    informaticaXmlSb.append(SharedTrans());
    informaticaXmlSb.append("</REPOSITORY> \n");
    informaticaXmlSb.append("</POWERMART> \n");

    return informaticaXmlSb;
    }
}

function validMap(){
    
    var mappingSpecificationRows = vmappingManagerUtil.getMappingSpecifications(mapping.getMappindId());
    var mappingVo = vmappingManagerUtil.getMapping(mapping.getMappindId());
    var mapName = mappingVo.getMappingName();

    var tgtTblCls;
    
    for (var y=0;y<mappingSpecificationRows.size();
         y++) 
    {
        if (mappingSpecificationRows.get(y)!==null) 
        {
            if (mappingSpecificationRows.get(y).getSourceTableName()!== null && !mappingSpecificationRows.get(y).getSourceTableName().equals("SYS") && mappingSpecificationRows.get(y)!==null)  
            {
                if ("HKEY".equals(mappingSpecificationRows.get(y).getTargetColumnClass())){

                    tgtTblCls = mappingSpecificationRows.get(y).getTargetTableClass();
                }
            }
        }
    }
    
    if(mapName.contains("_L_") || tgtTblCls.equals("LINK")){
        
        return "TRUE";
    }
    else{
        return "FALSE";        
    }
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
    var tgtCol = "";

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

    sourceTableName = sourceTable.substring(sourceTable.indexOf(".")+1)+vSrcTblSuffix;

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
                    tgtCol = tfrms.get(j).getOutputColumns().get(0).getColumnName();

                    if (dataType.equalsIgnoreCase("number") ){
                        dataType = "decimal";
                        dataLength = "4";
                        dataPrecision = "4";
                    }

                    if (dataType.equalsIgnoreCase("LONGVARCHAR") || dataType.toUpperCase().contains("VARCHAR") ){
                        dataType = "VARCHAR";
                        dataLength = "255";
                        dataPrecision = "255";
                    }

                    if (dataType.equalsIgnoreCase("TIMESTAMP") || dataType.toUpperCase().contains("TIMESTAMP")){
                        dataType = "TIMESTAMP";
                        dataLength = "26";
                        dataPrecision = "26";
                        dataScale = "6";
                    }

                    /** If datatype is DATE ,then Length and Precision as 10.*/                      
                    if (dataType.equalsIgnoreCase("DATE") && dataLength.equals("0")){
                        dataLength = "10";
                        dataPrecision = "10";
                    }
                }
                if (!tgtCol.equalsIgnoreCase("PDIL_HK")){
                src.append("        <SOURCEFIELD BUSINESSNAME =\"\" DATATYPE =\""+dataType+"\" DESCRIPTION =\"\" FIELDNUMBER =\""+(j+1)+"\" FIELDPROPERTY =\"0\" FIELDTYPE =\"ELEMITEM\" HIDDEN =\"NO\" KEYTYPE =\"NOT A KEY\" LENGTH =\"0\" LEVEL =\"0\" NAME =\""+sourceColumnName+"\" NULLABLE =\"NULL\" OCCURS =\"0\" OFFSET =\"0\" PHYSICALLENGTH =\""+dataLength+"\" PHYSICALOFFSET =\"0\" PICTURETEXT =\"\" PRECISION =\""+dataPrecision+"\" SCALE =\""+dataScale+"\" USAGE_FLAGS =\"\"/>\n");
            }
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
    var keyType;
    var nullType;
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

            if (!tfrms.get(i).getOutputColumns().get(0).getParentTable().getCompleteName().equals("SYS1")){
                targetTable = tfrms.get(i).getOutputColumns().get(0).getParentTable().getCompleteName();
            }
        }
    }

    targetTableName = targetTable.substring(targetTable.indexOf(".")+1);

    tgtLkp.append("    <SOURCE BUSINESSNAME =\"\" DATABASETYPE =\""+vTargetComponent+"\" DBDNAME =\""+vTgtLkpDB+"\" DESCRIPTION =\"\" NAME =\"" +targetTableName+ "\" OBJECTVERSION =\"1\" OWNERNAME =\""+tgtSchema+"\" VERSIONNUMBER =\"1\"> \n");
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
                    
                    if (targetColumnClass.equalsIgnoreCase("HKEY") || targetColumnClass.equalsIgnoreCase("LDTS")){
                        keyType ="PRIMARY KEY";
                        nullType ="NOTNULL";
                    }
                    else{
                        keyType ="NOT A KEY";
                        nullType ="NULL";
                    }

                    if (dataType.equalsIgnoreCase("number")){
                        dataType = "decimal";
                        dataLength = "4";
                        dataPrecision = "4";
                    }

                    if (dataType.toUpperCase().contains("VARCHAR")){
                        dataType = "VARCHAR";
                        dataLength = "255";
                        dataPrecision = "255";
                    }

                    if (dataType.equalsIgnoreCase("TIMESTAMP") || dataType.toUpperCase().contains("TIMESTAMP")){
                        dataType = "TIMESTAMP";
                        dataLength = "26";
                        dataPrecision = "26";
                        dataScale = "6";
                    }

                    if (dataType.equalsIgnoreCase("DATE") && dataLength.equals("0")){
                        dataLength = "10";
                        dataPrecision = "10";
                    }
                }

                tgtLkp.append("        <SOURCEFIELD BUSINESSNAME =\"\" DATATYPE =\""+dataType+"\" DESCRIPTION =\"\" FIELDNUMBER =\""+(j+1)+"\" FIELDPROPERTY =\"0\" FIELDTYPE =\"ELEMITEM\" HIDDEN =\"NO\" KEYTYPE =\""+keyType+"\" LENGTH =\"0\" LEVEL =\"0\" NAME =\""+targetColumnName+"\" NULLABLE =\""+nullType+"\" OCCURS =\"0\" OFFSET =\"0\" PHYSICALLENGTH =\""+dataLength+"\" PHYSICALOFFSET =\"0\" PICTURETEXT =\"\" PRECISION =\""+dataPrecision+"\" SCALE =\""+dataScale+"\" USAGE_FLAGS =\"\"/>\n");
                tgt.append("        <TARGETFIELD BUSINESSNAME =\"\" DATATYPE =\""+dataType+"\" DESCRIPTION =\"\" FIELDNUMBER =\""+(j+1)+"\" KEYTYPE =\""+keyType+"\" NAME =\""+targetColumnName+"\" NULLABLE =\""+nullType+"\" PICTURETEXT =\"\" PRECISION =\""+dataPrecision+"\" SCALE =\""+dataScale+"\"/>  \n");
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
    var srtT = new java.lang.StringBuffer();
    var sqTgt = new java.lang.StringBuffer();
    var expT = new java.lang.StringBuffer();
    var expTgt = new java.lang.StringBuffer();
    var expT1 = new java.lang.StringBuffer();
    var jnrT = new java.lang.StringBuffer();
    var filT = new java.lang.StringBuffer();
    var inst = new java.lang.StringBuffer();
    var conctSqSrc = new java.lang.StringBuffer();
    var conctSqTgt = new java.lang.StringBuffer();
    var conctExpT = new java.lang.StringBuffer();
    var conctSrtT = new java.lang.StringBuffer();
    var conctExpT1 = new java.lang.StringBuffer();
    var conctJnrT = new java.lang.StringBuffer();
    var conctFilT = new java.lang.StringBuffer();
    var HKeyData = new java.lang.StringBuffer();
    var JavaComp = new java.lang.StringBuffer();
    var sourceTable = "";
    var targetTable = "";
    var sourceTableName = "";
    var targetTableName = "";
    var sourceBKeyColumn ="";
    var sourceColumnName = "";
    var targetColumnName="";
    var expressionFields ="";
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
    var eBRule = "";
    var sortKey = "";
    var hKeyVal = "";
    var tgtColName = "";


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
    JavaComp.append("        <METADATAEXTENSION COMPONENTVERSION =\"1000000\" DATATYPE =\"STRING\" DESCRIPTION =\"\" DOMAINNAME =\"Java_Transform_Domain\" ISCLIENTEDITABLE =\"NO\" ISCLIENTVISIBLE =\"NO\" ISREUSABLE =\"YES\" ISSHAREREAD =\"YES\" ISSHAREWRITE =\"YES\" MAXLENGTH =\"2147483647\" NAME =\"Byte_Code\" VALUE =\"yv66vgAAADMA8AoAQwBhBwBiCgACAGEJAEIAYwsAZABlBwBmCgAGAGcJAEIAaAoAQgBpCABqCgBCAGsKAGwAbQoABgBuCABGCgBCAG8KAEIAcAoAQgBxCgBCAHIHAHMJAEIAdAoAdQB2CQBCAHcJAEIAeAoAdQB5CgACAHoKAHUAewoAAgB8CQBCAH0JAEIAfgkAQgB/CgCAAIEKAIIAgwcAhAoAIQBhCACFCgAhAIYKACEAfAoAQgCHBwCICgAnAIkKAIIAigoAiwCMCQBCAI0HAI4JAEIAjwoALACJCQBCAJAJAEIAkQoAQgCSBwCTCgBCAJQKAEIAlQkAQgCWCQBCAJcKAEIAmAkAQgCZCgCaAHwKAEIAmwkAQgCcCgATAJ0KABMAngcAnwoAQgCgCgBCAKEKAEIAogcAowcApAEABnN0ckJ1ZgEAGExqYXZhL2xhbmcvU3RyaW5nQnVmZmVyOwEADUJJTkFSWV9PVVRQVVQBAAJbQgEABjxpbml0PgEAAygpVgEABENvZGUBAA9MaW5lTnVtYmVyVGFibGUBAARpbml0AQAjKExqYXZhL3V0aWwvTGlzdDtMamF2YS91dGlsL0xpc3Q7KVYBAA1TdGFja01hcFRhYmxlBwBmAQAKRXhjZXB0aW9ucwEAB2V4ZWN1dGUBAGsoTGNvbS9pbmZvcm1hdGljYS9wb3dlcmNlbnRlci9zZGsvcmVwb3NpdG9yeS9JR3JvdXA7TGNvbS9pbmZvcm1hdGljYS9wb3dlcmNlbnRlci9zZGsvc2VydmVyL0lJbnB1dEJ1ZmZlcjspVgcAowcApQcApgcApwcARwcAkwEAD2VvZk5vdGlmaWNhdGlvbgEANihMY29tL2luZm9ybWF0aWNhL3Bvd2VyY2VudGVyL3Nkay9yZXBvc2l0b3J5L0lHcm91cDspVgEAEGlucHV0VHJhbnNhY3Rpb24BAAQoSSlWAQALZ2VuZXJhdGVSb3cHAJ8BAApTb3VyY2VGaWxlAQAeSlRYUGFydGl0aW9uRHJpdmVySW1wbEdlbi5qYXZhDABIAEkBABZqYXZhL2xhbmcvU3RyaW5nQnVmZmVyDABEAEUHAKgMAKkAqgEAMmNvbS9pbmZvcm1hdGljYS9wb3dlcmNlbnRlci9zZGsvc2VydmVyL0lCdWZmZXJJbml0DACrAKwMAK0ArgwArwBJAQAFSU5QVVQMALAAsQcAsgwAswC0DAC1ALYMALcAsQwAuAC5DAC6AEkMALsAvAEANGNvbS9pbmZvcm1hdGljYS9wb3dlcmNlbnRlci9zZGsvc2VydmVyL0lPdXRwdXRCdWZmZXIMAL0AvgcApgwAvwCsDADAAK4MAEYARwwAwQDCDADDAFwMAMQAxQwAxgDHDADIAMkMAMoAywwAzADNBwDODADPANAHAKcMANEArAEAF2phdmEvbGFuZy9TdHJpbmdCdWlsZGVyAQBURXhjZXB0aW9uIGluIGhleFN0cmluZ1RvQnl0ZUFycmF5OiBFeHBlY3RlZCAzMiBjaGFyYWN0ZXJzIHRvIHBhcnNlLCByZWNlaXZlZCBpbnB1dDogDADSANMMANQA1QEAGmphdmEvbGFuZy9SdW50aW1lRXhjZXB0aW9uDABIANUMANYA1wcA2AwA2QDaDADbAMkBADhjb20vaW5mb3JtYXRpY2EvcG93ZXJjZW50ZXIvc2VydmVyL2p0eC9KVFhGYXRhbEV4Y2VwdGlvbgwA3ADdDADeAM0MAN8AyQwAXQBJAQAsY29tL2luZm9ybWF0aWNhL3Bvd2VyY2VudGVyL3Nkay9TREtFeGNlcHRpb24MAOAA4QwA4gBJDADjAM0MAOQAzQwA5QBJDADmAM0HAOcMAOgAsQwA6QCuDADqALYMAOsA7AEAPWNvbS9pbmZvcm1hdGljYS9wb3dlcmNlbnRlci9zZGsvc2VydmVyL0RhdGFUcnVuY2F0ZWRFeGNlcHRpb24MAO0A1QwA7gBJDADvAEkBAEBjb20vaW5mb3JtYXRpY2EvcG93ZXJjZW50ZXIvc2VydmVyL2p0eC9KVFhQYXJ0aXRpb25Ecml2ZXJJbXBsR2VuAQBCY29tL2luZm9ybWF0aWNhL3Bvd2VyY2VudGVyL3NlcnZlci9qdHgvSlRYUGFydGl0aW9uRHJpdmVySW1wbEZpeGVkAQAxY29tL2luZm9ybWF0aWNhL3Bvd2VyY2VudGVyL3Nkay9yZXBvc2l0b3J5L0lHcm91cAEAM2NvbS9pbmZvcm1hdGljYS9wb3dlcmNlbnRlci9zZGsvc2VydmVyL0lJbnB1dEJ1ZmZlcgEAEGphdmEvbGFuZy9TdHJpbmcBAA5qYXZhL3V0aWwvTGlzdAEAA2dldAEAFShJKUxqYXZhL2xhbmcvT2JqZWN0OwEAC2dldENhcGFjaXR5AQADKClJAQAMb3V0cHV0QnVmQ2FwAQABSQEACmluaXRpYWxpemUBABBpc0luRmxkQ29ubmVjdGVkAQAVKExqYXZhL2xhbmcvU3RyaW5nOylaAQAvY29tL2luZm9ybWF0aWNhL3Bvd2VyY2VudGVyL3NlcnZlci9qdHgvSlRYVXRpbHMBABNpc1NlcnZlclVuaWNvZGVNb2RlAQADKClaAQASYmluZENvbHVtbkRhdGFUeXBlAQAFKElJKVYBABFpc091dEZsZFByb2plY3RlZAEADnNldElucHV0QnVmZmVyAQA4KExjb20vaW5mb3JtYXRpY2EvcG93ZXJjZW50ZXIvc2RrL3NlcnZlci9JSW5wdXRCdWZmZXI7KVYBABRyZXNldE91dHB1dFJvd051bWJlcgEAEGdldE91dHB1dEJ1ZmZlcnMBABIoKUxqYXZhL3V0aWwvTGlzdDsBAAlvdXRwdXRCdWYBADZMY29tL2luZm9ybWF0aWNhL3Bvd2VyY2VudGVyL3Nkay9zZXJ2ZXIvSU91dHB1dEJ1ZmZlcjsBABNnZXROdW1Sb3dzQXZhaWxhYmxlAQAIaW5Sb3dOdW0BAAZpc051bGwBAAUoSUkpWgEACXNldExlbmd0aAEAD2dldFN0cmluZ0J1ZmZlcgEAHShJSUxqYXZhL2xhbmcvU3RyaW5nQnVmZmVyOylJAQAIdG9TdHJpbmcBABQoKUxqYXZhL2xhbmcvU3RyaW5nOwEACWlzVmVyYm9zZQEAAVoBAAt1dGlsc1NlcnZlcgEANUxjb20vaW5mb3JtYXRpY2EvcG93ZXJjZW50ZXIvc2RrL3NlcnZlci9JVXRpbHNTZXJ2ZXI7AQAPQkVHSU5fSU5QVVRfUk9XAQAsTGNvbS9pbmZvcm1hdGljYS9wb3dlcmNlbnRlci9zZGsvU0RLTWVzc2FnZTsBADNjb20vaW5mb3JtYXRpY2EvcG93ZXJjZW50ZXIvc2RrL3NlcnZlci9JVXRpbHNTZXJ2ZXIBAAZsb2dNc2cBADAoSUxjb20vaW5mb3JtYXRpY2EvcG93ZXJjZW50ZXIvc2RrL1NES01lc3NhZ2U7KVYBAAZsZW5ndGgBAAZhcHBlbmQBAC0oTGphdmEvbGFuZy9TdHJp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\" VENDORNAME =\"INFORMATICA\"/> \n");
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

    /** Iterate over the mapping specifications to get the BKeys,Source and Target Table Names */
    
  
    for (var y=0;y<tfrms.size();
         y++) 
    {
        if (tfrms.get(y).getInputColumns().size()>0) 
        {
            if (!tfrms.get(y).getInputColumns().get(0).getParentTable().getCompleteName().equals("SYS") && !tfrms.get(y).getInputColumns().get(0).getParentTable().getCompleteName().equals(""))  
            {
                sourceTable = tfrms.get(y).getInputColumns().get(0).getParentTable().getCompleteName();
          }
       }
    }


    for (var i=0;i<tfrms.size();
         i++) 
    {
        if (tfrms.get(i).getOutputColumns().size()>0){

            if (!tfrms.get(i).getOutputColumns().get(0).getParentTable().getCompleteName().equals("SYS1")){
                targetTable = tfrms.get(i).getOutputColumns().get(0).getParentTable().getCompleteName();
            }
        }
    }

    sourceTableName = "SC_"+sourceTable.substring(sourceTable.indexOf(".")+1)+vSrcTblSuffix;

    targetTableName = "SC_"+targetTable.substring(targetTable.indexOf(".")+1);

    sqSrc.append("        <TRANSFORMATION DESCRIPTION =\"\" NAME =\"SQ_"+sourceTableName+"\" OBJECTVERSION =\"1\" REUSABLE =\"NO\" TYPE =\"Source Qualifier\" VERSIONNUMBER =\"1\"> \n");
    sqTgt.append("        <TRANSFORMATION DESCRIPTION =\"\" NAME =\"SQ_"+targetTableName+"\" OBJECTVERSION =\"1\" REUSABLE =\"NO\" TYPE =\"Source Qualifier\" VERSIONNUMBER =\"1\"> \n");
    expT.append("        <TRANSFORMATION DESCRIPTION =\"\" NAME =\"EXP_SRC\" OBJECTVERSION =\"1\" REUSABLE =\"NO\" TYPE =\"Expression\" VERSIONNUMBER =\"1\"> \n");
    expTgt.append("        <TRANSFORMATION DESCRIPTION =\"\" NAME =\"EXP_TGT\" OBJECTVERSION =\"1\" REUSABLE =\"NO\" TYPE =\"Expression\" VERSIONNUMBER =\"1\"> \n");
    expT1.append("        <TRANSFORMATION DESCRIPTION =\"\" NAME =\"EXP_AFT_FIL\" OBJECTVERSION =\"1\" REUSABLE =\"NO\" TYPE =\"Expression\" VERSIONNUMBER =\"1\"> \n");
    jnrT.append("        <TRANSFORMATION DESCRIPTION =\"\" NAME =\"JNR_SRC_VS_TGT\" OBJECTVERSION =\"1\" REUSABLE =\"NO\" TYPE =\"Joiner\" VERSIONNUMBER =\"1\"> \n");
    filT.append("        <TRANSFORMATION DESCRIPTION =\"\" NAME =\"FIL_TGT_NULL\" OBJECTVERSION =\"1\" REUSABLE =\"NO\" TYPE =\"Filter\" VERSIONNUMBER =\"1\"> \n");
    srtT.append("        <TRANSFORMATION DESCRIPTION =\"\" NAME =\"SRT_SRC\" OBJECTVERSION =\"1\" REUSABLE =\"NO\" TYPE =\"Sorter\" VERSIONNUMBER =\"1\"> \n");


    /** Iterate over the mapping specifications to get the fields information */
    for (var j=0;j<tfrms.size();
         j++)
        if (tfrms.get(j).getInputColumns().size()>0) {
            if (!tfrms.get(j).getInputColumns().get(0).getParentTable().getCompleteName().equals("SYS")) {

                if (!tfrms.get(j).getInputColumns().get(0).getParentTable().getCompleteName().equals("")) {

                    sourceColumnName = tfrms.get(j).getInputColumns().get(0).getColumnName();

                    srcDataType = tfrms.get(j).getInputColumns().get(0).getDataType();

                    srcDataLength = tfrms.get(j).getInputColumns().get(0).getLength();

                    srcDataPrecision = tfrms.get(j).getInputColumns().get(0).getPrecision();

                    srcDataScale = tfrms.get(j).getInputColumns().get(0).getScale();
                    
                    tgtColName = tfrms.get(j).getOutputColumns().get(0).getColumnName();

                    if (srcDataType.equalsIgnoreCase("number") && srcDataLength.equals("0")){
                        srcDataLength = "4";
                        srcDataPrecision = "4";

                    }

                    if (srcDataType.toUpperCase().contains("VARCHAR")){
                        srcDataType = "varchar";
                        srcDataLength = "255";
                        srcDataPrecision = "255";
                    }

                    if (srcDataType.equalsIgnoreCase("DATE") || srcDataType.equalsIgnoreCase("DATETIME")){
                        srcDataPrecision = "29";
                        srcDataScale = "9";
                    }

                    if (srcDataType.equalsIgnoreCase("TIMESTAMP") || srcDataType.toUpperCase().contains("TIMESTAMP")){
                        srcDataType = "TIMESTAMP";
                        srcDataLength = "29";
                        srcDataPrecision = "29";
                        srcDataScale = "9";
                    }

                    if (srcDataType.equalsIgnoreCase("varchar") || srcDataType.equalsIgnoreCase("varchar2") || srcDataType.equalsIgnoreCase("char") || srcDataType.equalsIgnoreCase("LONGVARCHAR")){
                        srcDataTypeFormat = "string";
                    }
                    else if (srcDataType.equalsIgnoreCase("timestamp") || srcDataType.equalsIgnoreCase("date") || srcDataType.equalsIgnoreCase("datetime") || srcDataType.toUpperCase().contains("TIMESTAMP")){
                        srcDataTypeFormat = "date/time";

                    }
                    else if (srcDataType.equalsIgnoreCase("number(p,s)")){
                        srcDataTypeFormat = "decimal";
                    }
                    else if (srcDataType.equalsIgnoreCase("number")){
                        srcDataTypeFormat = "integer";
                    }
                    else if (srcDataType.equalsIgnoreCase("byte")){
                        srcDataTypeFormat = "binary";
                    }
                    else   {
                        srcDataTypeFormat = srcDataType;
                    }

                }


                if (!tgtColName.equalsIgnoreCase("PDIL_HK")){

                sqSrc.append("            <TRANSFORMFIELD DATATYPE =\""+srcDataTypeFormat+"\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" NAME =\""+sourceColumnName+"\" PICTURETEXT =\"\" PORTTYPE =\"INPUT/OUTPUT\" PRECISION =\""+srcDataPrecision+"\" SCALE =\""+srcDataScale+"\"/>  \n");
                conctSqSrc.append("        <CONNECTOR FROMFIELD =\""+sourceColumnName+"\" FROMINSTANCE =\""+sourceTableName+"\" FROMINSTANCETYPE =\"Source Definition\" TOFIELD =\""+sourceColumnName+"\" TOINSTANCE =\"SQ_"+sourceTableName+"\" TOINSTANCETYPE =\"Source Qualifier\"/> \n");
                conctSqSrc.append("        <CONNECTOR FROMFIELD =\""+sourceColumnName+"\" FROMINSTANCE =\"SQ_"+sourceTableName+"\" FROMINSTANCETYPE =\"Source Qualifier\" TOFIELD =\""+sourceColumnName+"\" TOINSTANCE =\"EXP_SRC\" TOINSTANCETYPE =\"Expression\"/> \n");
                expT.append("            <TRANSFORMFIELD DATATYPE =\""+srcDataTypeFormat+"\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" EXPRESSION =\""+sourceColumnName+"\" EXPRESSIONTYPE =\"GENERAL\" NAME =\""+sourceColumnName+"\" PICTURETEXT =\"\" PORTTYPE =\"INPUT\" PRECISION =\""+srcDataPrecision+"\" SCALE =\""+srcDataScale+"\"/> \n");
            }
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
                        tgtDataLength = "4";
                        tgtDataPrecision = "4";
                    }

                    if (tgtDataType.toUpperCase().contains("VARCHAR")){
                        tgtDataType = "varchar";
                        tgtDataLength = "255";
                        tgtDataPrecision = "255";
                    }

                    if (tgtDataType.equalsIgnoreCase("TIMESTAMP") || tgtDataType.toUpperCase().contains("TIMESTAMP")){
                        tgtDataType = "TIMESTAMP";
                        tgtDataLength = "29";
                        tgtDataPrecision = "29";
                        tgtDataScale = "9";
                    }


                    if (tgtDataType.equalsIgnoreCase("DATE") || tgtDataType.equalsIgnoreCase("DATETIME")){
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


                    /** It will generates the port type for Expression fields */
                    if(tgtColCls.equalsIgnoreCase("BKEY") || tgtColCls.equalsIgnoreCase("USER") ){
                        portType = "INPUT/OUTPUT";

                    }
                    else{
                        portType = "OUTPUT";
                    }
                    /** It will creates expression values for Expression Fields */  
                    
                        eBRule = tfrms.get(n).getExtendedBusinessRule();
                        HKeyData = new java.lang.StringBuffer();
                        for(var hk=0;hk<eBRule.split(",").length;
                            hk++){
                            HKeyData.append("UPPER(LTRIM(RTRIM("+eBRule.split(",")[hk]+"))) ||&apos;"+vHashDelimeter+"&apos;||");
                        }

                        var eBRuleNew = HKeyData.toString();
                        eBRuleNew = eBRuleNew.substring(0, eBRuleNew.length()-18);
                        hKeyVal= "MD5("+eBRuleNew+")";

                    
                    if(tgtColCls.equalsIgnoreCase("LDTS")){

                        expValue= vLoadTimeStamp;

                    }
                    else if(tgtColCls.equalsIgnoreCase("RSRC")){

                        expValue= STG_RSRC_VAL;

                    }
                    else if(targetColumnName.contains("CR_JOB")){

                        expValue= vCRJob;

                    }
                    else if(targetColumnName.contains("LOAD_ID")){

                        expValue= vLoadID;

                    }
                    else {
                        expValue = targetColumnName;
                    }

                    if(targetColumnName.equalsIgnoreCase("PDIL_HK")){
                        sortKey= "YES";
                    }
                    else {
                        sortKey= "NO";
                    }


                    if (tgtDataType.equalsIgnoreCase("varchar") || tgtDataType.equalsIgnoreCase("varchar2") || tgtDataType.equalsIgnoreCase("char") || tgtDataType.equalsIgnoreCase("LONGVARCHAR")){
                        tgtDataTypeFormat = "string";
                    }
                    else if (tgtDataType.equalsIgnoreCase("timestamp") || tgtDataType.equalsIgnoreCase("date") || tgtDataType.equalsIgnoreCase("datetime") || tgtDataType.toUpperCase().contains("TIMESTAMP")){
                        tgtDataTypeFormat = "date/time";
                    }
                    else if (tgtDataType.equalsIgnoreCase("number(p,s)")){
                        tgtDataTypeFormat = "decimal";
                    }
                    else if (tgtDataType.equalsIgnoreCase("number")){
                        tgtDataTypeFormat = "integer";
                    }
                    else if (tgtDataType.equalsIgnoreCase("byte")){
                        tgtDataTypeFormat = "binary";
                    }
                    else   {
                        tgtDataTypeFormat = tgtDataType;
                    }
                }

                sqTgt.append("            <TRANSFORMFIELD DATATYPE =\""+tgtDataTypeFormat+"\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" NAME =\""+targetColumnName+"\" PICTURETEXT =\"\" PORTTYPE =\"INPUT/OUTPUT\" PRECISION =\""+tgtDataPrecision+"\" SCALE =\""+tgtDataScale+"\"/>  \n");
                if(tgtColCls.equalsIgnoreCase("HKEY")){
                    expT.append("            <TRANSFORMFIELD DATATYPE =\"string\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" EXPRESSION =\""+hKeyVal+"\" EXPRESSIONTYPE =\"GENERAL\" NAME =\""+targetColumnName+"\" PICTURETEXT =\"\" PORTTYPE =\""+portType+"\" PRECISION =\""+tgtDataPrecision+"\" SCALE =\""+tgtDataScale+"\"/> \n");
                    srtT.append("            <TRANSFORMFIELD DATATYPE =\""+tgtDataTypeFormat+"\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" ISSORTKEY =\""+sortKey+"\" NAME =\""+targetColumnName+"\" PICTURETEXT =\"\" PORTTYPE =\"INPUT/OUTPUT\" PRECISION =\""+tgtDataPrecision+"\" SCALE =\""+tgtDataScale+"\" SORTDIRECTION =\"ASCENDING\"/> \n");

                    jnrT.append("            <TRANSFORMFIELD DATATYPE =\""+tgtDataTypeFormat+"\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" NAME =\""+targetColumnName+"\" PICTURETEXT =\"\" PORTTYPE =\"INPUT/OUTPUT\" PRECISION =\""+tgtDataPrecision+"\" SCALE =\""+tgtDataScale+"\"/>  \n");
                    filT.append("            <TRANSFORMFIELD DATATYPE =\""+tgtDataTypeFormat+"\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" NAME =\""+targetColumnName+"\" PICTURETEXT =\"\" PORTTYPE =\"INPUT/OUTPUT\" PRECISION =\""+tgtDataPrecision+"\" SCALE =\""+tgtDataScale+"\"/>  \n");
                    conctExpT.append("        <CONNECTOR FROMFIELD =\""+targetColumnName+"\" FROMINSTANCE =\"EXP_SRC\" FROMINSTANCETYPE =\"Expression\" TOFIELD =\"INPUT\" TOINSTANCE =\"Java_Convert_MD5ToBinary"+n+"\" TOINSTANCETYPE =\"Custom Transformation\"/> \n");
                    conctExpT.append("        <CONNECTOR FROMFIELD =\"BINARY_OUTPUT\" FROMINSTANCE =\"Java_Convert_MD5ToBinary"+n+"\" FROMINSTANCETYPE =\"Custom Transformation\" TOFIELD =\""+targetColumnName+"\" TOINSTANCE =\"SRT_SRC\" TOINSTANCETYPE =\"Sorter\"/> \n");

                    conctSrtT.append("        <CONNECTOR FROMFIELD =\""+targetColumnName+"\" FROMINSTANCE =\"SRT_SRC\" FROMINSTANCETYPE =\"Sorter\" TOFIELD =\""+targetColumnName+"\" TOINSTANCE =\"JNR_SRC_VS_TGT\" TOINSTANCETYPE =\"Joiner\"/> \n");
                    conctJnrT.append("        <CONNECTOR FROMFIELD =\""+targetColumnName+"\" FROMINSTANCE =\"JNR_SRC_VS_TGT\" FROMINSTANCETYPE =\"Joiner\" TOFIELD =\""+targetColumnName+"\" TOINSTANCE =\"FIL_TGT_NULL\" TOINSTANCETYPE =\"Filter\"/> \n");
                    conctFilT.append("        <CONNECTOR FROMFIELD =\""+targetColumnName+"\" FROMINSTANCE =\"FIL_TGT_NULL\" FROMINSTANCETYPE =\"Filter\" TOFIELD =\""+targetColumnName+"\" TOINSTANCE =\"EXP_AFT_FIL\" TOINSTANCETYPE =\"Expression\"/> \n");
                    inst.append("        <INSTANCE DESCRIPTION =\"\" NAME =\"Java_Convert_MD5ToBinary"+n+"\" REUSABLE =\"YES\" TRANSFORMATION_NAME =\"Java_Convert_MD5ToBinary\" TRANSFORMATION_TYPE =\"Custom Transformation\" TYPE =\"TRANSFORMATION\"/> \n");
                }
                if(!tgtColCls.equalsIgnoreCase("")){
                expT1.append("            <TRANSFORMFIELD DATATYPE =\""+tgtDataTypeFormat+"\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" EXPRESSION =\""+expValue+"\" EXPRESSIONTYPE =\"GENERAL\" NAME =\""+targetColumnName+"\" PICTURETEXT =\"\" PORTTYPE =\"INPUT/OUTPUT\" PRECISION =\""+tgtDataPrecision+"\" SCALE =\""+tgtDataScale+"\"/> \n");
                conctExpT1.append("        <CONNECTOR FROMFIELD =\""+targetColumnName+"\" FROMINSTANCE =\"EXP_AFT_FIL\" FROMINSTANCETYPE =\"Expression\" TOFIELD =\""+targetColumnName+"\" TOINSTANCE =\""+targetTableName+"_INS"+"\" TOINSTANCETYPE =\"Target Definition\"/> \n");
                }
                conctSqTgt.append("        <CONNECTOR FROMFIELD =\""+targetColumnName+"\" FROMINSTANCE =\""+targetTableName+"\" FROMINSTANCETYPE =\"Source Definition\" TOFIELD =\""+targetColumnName+"\" TOINSTANCE =\"SQ_"+targetTableName+"\" TOINSTANCETYPE =\"Source Qualifier\"/> \n");

            }
        }

    /** It will creates Transformation Table attributes for Source Qualifier, Expression, Joiner, Filter */
    sqTgt.append("            <TABLEATTRIBUTE NAME =\"Sql Query\" VALUE =\"\"/> \n");
    sqTgt.append("            <TABLEATTRIBUTE NAME =\"User Defined Join\" VALUE =\"\"/>\n");
    sqTgt.append("            <TABLEATTRIBUTE NAME =\"Source Filter\" VALUE =\"\"/>\n");
    sqTgt.append("            <TABLEATTRIBUTE NAME =\"Number Of Sorted Ports\" VALUE =\"1\"/>\n");
    sqTgt.append("            <TABLEATTRIBUTE NAME =\"Tracing Level\" VALUE =\"Normal\"/>\n");
    sqTgt.append("            <TABLEATTRIBUTE NAME =\"Select Distinct\" VALUE =\"NO\"/>\n");
    sqTgt.append("            <TABLEATTRIBUTE NAME =\"Is Partitionable\" VALUE =\"NO\"/>\n");
    sqTgt.append("            <TABLEATTRIBUTE NAME =\"Pre SQL\" VALUE =\"\"/>\n");
    sqTgt.append("            <TABLEATTRIBUTE NAME =\"Post SQL\" VALUE =\"\"/>\n");
    sqTgt.append("            <TABLEATTRIBUTE NAME =\"Output is deterministic\" VALUE =\"NO\"/>\n");
    sqTgt.append("            <TABLEATTRIBUTE NAME =\"Output is repeatable\" VALUE =\"Never\"/>\n");
    sqTgt.append("        </TRANSFORMATION>\n");

    sqSrc.append("            <TABLEATTRIBUTE NAME =\"Sql Query\" VALUE =\"\"/> \n");
    sqSrc.append("            <TABLEATTRIBUTE NAME =\"User Defined Join\" VALUE =\"\"/>\n");
    sqSrc.append("            <TABLEATTRIBUTE NAME =\"Source Filter\" VALUE =\"\"/>\n");
    sqSrc.append("            <TABLEATTRIBUTE NAME =\"Number Of Sorted Ports\" VALUE =\"1\"/>\n");
    sqSrc.append("            <TABLEATTRIBUTE NAME =\"Tracing Level\" VALUE =\"Normal\"/>\n");
    sqSrc.append("            <TABLEATTRIBUTE NAME =\"Select Distinct\" VALUE =\"NO\"/>\n");
    sqSrc.append("            <TABLEATTRIBUTE NAME =\"Is Partitionable\" VALUE =\"NO\"/>\n");
    sqSrc.append("            <TABLEATTRIBUTE NAME =\"Pre SQL\" VALUE =\"\"/>\n");
    sqSrc.append("            <TABLEATTRIBUTE NAME =\"Post SQL\" VALUE =\"\"/>\n");
    sqSrc.append("            <TABLEATTRIBUTE NAME =\"Output is deterministic\" VALUE =\"NO\"/>\n");
    sqSrc.append("            <TABLEATTRIBUTE NAME =\"Output is repeatable\" VALUE =\"Never\"/>\n");
    sqSrc.append("        </TRANSFORMATION>\n");

    expTgt.append("            <TRANSFORMFIELD DATATYPE =\"binary\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" EXPRESSION =\"PDIL_HK\" EXPRESSIONTYPE =\"GENERAL\" NAME =\"PDIL_HK\" PICTURETEXT =\"\" PORTTYPE =\"INPUT/OUTPUT\" PRECISION =\"16\" SCALE =\"0\"/> \n");
    expTgt.append("            <TABLEATTRIBUTE NAME =\"Tracing Level\" VALUE =\"Normal\"/> \n");
    expTgt.append("        </TRANSFORMATION>\n");
    
    expT.append("            <TABLEATTRIBUTE NAME =\"Tracing Level\" VALUE =\"Normal\"/> \n");
    expT.append("        </TRANSFORMATION>\n");

    expT1.append("            <TABLEATTRIBUTE NAME =\"Tracing Level\" VALUE =\"Normal\"/> \n");
    expT1.append("        </TRANSFORMATION>\n");

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

    jnrT.append("            <TRANSFORMFIELD DATATYPE =\"binary\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" NAME =\"TGT_PDIL_HK\" PICTURETEXT =\"\" PORTTYPE =\"INPUT/OUTPUT/MASTER\" PRECISION =\"16\" SCALE =\"0\"/> \n");
    jnrT.append("            <TABLEATTRIBUTE NAME =\"Case Sensitive String Comparison\" VALUE =\"YES\"/> \n");
    jnrT.append("            <TABLEATTRIBUTE NAME =\"Cache Directory\" VALUE =\"$PMCacheDir\"/> \n");
    jnrT.append("            <TABLEATTRIBUTE NAME =\"Join Condition\" VALUE =\"TGT_PDIL_HK = PDIL_HK\"/> \n");
    jnrT.append("            <TABLEATTRIBUTE NAME =\"Join Type\" VALUE =\"Master Outer Join\"/> \n");
    jnrT.append("            <TABLEATTRIBUTE NAME =\"Null ordering in master\" VALUE =\"Null Is Highest Value\"/> \n");
    jnrT.append("            <TABLEATTRIBUTE NAME =\"Null ordering in detail\" VALUE =\"Null Is Highest Value\"/> \n");
    jnrT.append("            <TABLEATTRIBUTE NAME =\"Tracing Level\" VALUE =\"Normal\"/> \n");
    jnrT.append("            <TABLEATTRIBUTE NAME =\"Joiner Data Cache Size\" VALUE =\"Auto\"/> \n");
    jnrT.append("            <TABLEATTRIBUTE NAME =\"Joiner Index Cache Size\" VALUE =\"Auto\"/> \n");
    jnrT.append("            <TABLEATTRIBUTE NAME =\"Sorted Input\" VALUE =\"YES\"/> \n");
    jnrT.append("            <TABLEATTRIBUTE NAME =\"Master Sort Order\" VALUE =\"Auto\"/> \n");
    jnrT.append("            <TABLEATTRIBUTE NAME =\"Transformation Scope\" VALUE =\"All Input\"/> \n");
    jnrT.append("        </TRANSFORMATION> \n");

    filT.append("            <TRANSFORMFIELD DATATYPE =\"binary\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" NAME =\"TGT_PDIL_HK\" PICTURETEXT =\"\" PORTTYPE =\"INPUT/OUTPUT\" PRECISION =\"16\" SCALE =\"0\"/> \n");
    filT.append("            <TABLEATTRIBUTE NAME =\"Filter Condition\" VALUE =\"ISNULL(TGT_PDIL_HK)\"/> \n");
    filT.append("            <TABLEATTRIBUTE NAME =\"Tracing Level\" VALUE =\"Normal\"/> \n");
    filT.append("        </TRANSFORMATION> \n");

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
    inst.append("        <INSTANCE DESCRIPTION =\"\" NAME =\"FIL_TGT_NULL\" REUSABLE =\"NO\" TRANSFORMATION_NAME =\"FIL_TGT_NULL\" TRANSFORMATION_TYPE =\"Filter\" TYPE =\"TRANSFORMATION\"/> \n");
    inst.append("        <INSTANCE DESCRIPTION =\"\" NAME =\"SRT_SRC\" REUSABLE =\"NO\" TRANSFORMATION_NAME =\"SRT_SRC\" TRANSFORMATION_TYPE =\"Sorter\" TYPE =\"TRANSFORMATION\"/> \n");
    inst.append("        <INSTANCE DESCRIPTION =\"\" NAME =\"EXP_AFT_FIL\" REUSABLE =\"NO\" TRANSFORMATION_NAME =\"EXP_AFT_FIL\" TRANSFORMATION_TYPE =\"Expression\" TYPE =\"TRANSFORMATION\"/> \n");
    inst.append("        <INSTANCE DESCRIPTION =\"\" NAME =\"SC_exp_SET_DWH_COLUMNS\" REUSABLE =\"YES\" TRANSFORMATION_NAME =\"SC_exp_SET_DWH_COLUMNS\" TRANSFORMATION_TYPE =\"Expression\" TYPE =\"TRANSFORMATION\"/> \n");
    inst.append("        <INSTANCE DBDNAME =\""+vSourceDB+"\" DESCRIPTION =\"\" NAME =\""+sourceTableName+"\" TRANSFORMATION_NAME =\""+sourceTableName+"\" TRANSFORMATION_TYPE =\"Source Definition\" TYPE =\"SOURCE\"/> \n");
    inst.append("        <INSTANCE DBDNAME =\""+vTgtLkpDB+"\" DESCRIPTION =\"\" NAME =\""+targetTableName+"\" TRANSFORMATION_NAME =\""+targetTableName+"\" TRANSFORMATION_TYPE =\"Source Definition\" TYPE =\"SOURCE\"/> \n");

    conctFilT.append("        <CONNECTOR FROMFIELD =\"PDIL_SOURCE_SYSTEM\" FROMINSTANCE =\"EXP_AFT_FIL\" FROMINSTANCETYPE =\"Expression\" TOFIELD =\"IN_FIELD_CHAR\" TOINSTANCE =\"SC_exp_SET_DWH_COLUMNS\" TOINSTANCETYPE =\"Expression\"/>\n");
    conctSqTgt.append("        <CONNECTOR FROMFIELD =\"PDIL_HK\" FROMINSTANCE =\"SQ_"+targetTableName+"\" FROMINSTANCETYPE =\"Source Qualifier\" TOFIELD =\"PDIL_HK\" TOINSTANCE =\"EXP_TGT\" TOINSTANCETYPE =\"Expression\"/> \n");
    conctSqTgt.append("        <CONNECTOR FROMFIELD =\"PDIL_HK\" FROMINSTANCE =\"EXP_TGT\" FROMINSTANCETYPE =\"Expression\" TOFIELD =\"TGT_PDIL_HK\" TOINSTANCE =\"JNR_SRC_VS_TGT\" TOINSTANCETYPE =\"Joiner\"/> \n");
    conctJnrT.append("        <CONNECTOR FROMFIELD =\"TGT_PDIL_HK\" FROMINSTANCE =\"JNR_SRC_VS_TGT\" FROMINSTANCETYPE =\"Joiner\" TOFIELD =\"TGT_PDIL_HK\" TOINSTANCE =\"FIL_TGT_NULL\" TOINSTANCETYPE =\"Filter\"/> \n");
    conctExpT1.append("        <CONNECTOR FROMFIELD =\"DWH_LOAD_ID\" FROMINSTANCE =\"SC_exp_SET_DWH_COLUMNS\" FROMINSTANCETYPE =\"Expression\" TOFIELD =\"PDIL_CR_LOAD_ID\" TOINSTANCE =\""+targetTableName+"_INS"+"\" TOINSTANCETYPE =\"Target Definition\"/> \n");    
    conctExpT1.append("        <CONNECTOR FROMFIELD =\"DWH_JOB\" FROMINSTANCE =\"SC_exp_SET_DWH_COLUMNS\" FROMINSTANCETYPE =\"Expression\" TOFIELD =\"PDIL_CR_JOB\" TOINSTANCE =\""+targetTableName+"_INS"+"\" TOINSTANCETYPE =\"Target Definition\"/> \n");

    mappingDetailsOut.append(sqSrc);
    mappingDetailsOut.append(sqTgt);
    mappingDetailsOut.append(expT);
    mappingDetailsOut.append(expTgt);
    mappingDetailsOut.append(srtT);
    mappingDetailsOut.append(jnrT);
    mappingDetailsOut.append(filT);
    mappingDetailsOut.append(expT1);
    mappingDetailsOut.append(inst);
    mappingDetailsOut.append(conctSqSrc);
    mappingDetailsOut.append(conctExpT1);
    mappingDetailsOut.append(conctSqTgt);
    mappingDetailsOut.append(conctExpT);
    mappingDetailsOut.append(conctSrtT);
    mappingDetailsOut.append(conctJnrT);
    mappingDetailsOut.append(conctFilT);

    mappingDetailsOut.append("        <TARGETLOADORDER ORDER =\"1\" TARGETINSTANCE =\""+targetTableName+"_INS"+"\"/> \n");
    mappingDetailsOut.append("    </MAPPING> \n");

    var vsourceTableName = sourceTableName.replace("SC_","");
    var vtargetTableName = targetTableName.replace("SC_","");

    mappingDetailsOut.append("    <SHORTCUT COMMENTS =\"\" DBDNAME =\""+vSourceDB+"\" FOLDERNAME =\""+vSharedFolderName+"\" NAME =\""+sourceTableName+"\" OBJECTSUBTYPE =\"Source Definition\" OBJECTTYPE =\"SOURCE\" REFERENCEDDBD =\""+vSourceDB+"\" REFERENCETYPE =\"LOCAL\" REFOBJECTNAME =\""+vsourceTableName+"\" REPOSITORYNAME =\""+vRepo+"\" VERSIONNUMBER =\"1\"/> \n");
    mappingDetailsOut.append("    <SHORTCUT COMMENTS =\"\" DBDNAME =\""+vTgtLkpDB+"\" FOLDERNAME =\""+vSharedFolderName+"\" NAME =\""+targetTableName+"\" OBJECTSUBTYPE =\"Source Definition\" OBJECTTYPE =\"SOURCE\" REFERENCEDDBD =\""+vTgtLkpDB+"\" REFERENCETYPE =\"LOCAL\" REFOBJECTNAME =\""+vtargetTableName+"\" REPOSITORYNAME =\""+vRepo+"\" VERSIONNUMBER =\"1\"/> \n");
    mappingDetailsOut.append("    <SHORTCUT COMMENTS =\"\" FOLDERNAME =\""+vSharedFolderName+"\" NAME =\""+targetTableName+"\" OBJECTSUBTYPE =\"Target Definition\" OBJECTTYPE =\"TARGET\" REFERENCETYPE =\"LOCAL\" REFOBJECTNAME =\""+vtargetTableName+"\" REPOSITORYNAME =\""+vRepo+"\" VERSIONNUMBER =\"1\"/>\n");

    return mappingDetailsOut;

}