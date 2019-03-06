/** 
 * CAT : INFA_DV_STG_CAT
 * Developer: Ramana Katabattina
 * Organization: Analytix Data Services.
 */ 

importPackage(java.io);
importPackage(java.lang);
importPackage(java.util);
importPackage(com.ads.mm.db.util);
importPackage(com.ads.api.util);
importPackage(com.ads.api.beans.common);
importPackage(com.ads.api.beans);
importPackage(com.ads.api.beans.sm);
importPackage(com.ads.api.beans.mm);
importPackage(com.ads.mm.etl.xml.mapping);


/** Global variables */
var mapping = MAPPING;
var map_Id ;
var vmappingManagerUtil = new MappingManagerUtil(AUTH_TOKEN);



/** Main function */
function execute() {

    map_Id = mapping.getMappindId();

    var infaXML = new java.lang.StringBuffer();
    
    var mappingVo = vmappingManagerUtil.getMapping(MAPID);


    /** Creates Informatica .xml header */
    infaXML.append(CreateHeader());
    
    /** Creates Informatica .xml Source details */    
    infaXML.append(Source());
    
    /** Creates Informatica .xml Target details */
    infaXML.append(Target());
    
    /** Creates Informatica .xml Mapping details */
    infaXML.append(MappingDetails(map_Id));
    infaXML.append("</FOLDER> \n");
    infaXML.append("</REPOSITORY> \n");
    infaXML.append("</POWERMART> \n");

    return infaXML;

}

/** Creates Informatica .xml Header creation point */
function CreateHeader(){

    var header = new java.lang.StringBuffer();

    header.append("<?xml version=\"1.0\" encoding=\"Windows-1252\"?> \n");
    header.append("<!DOCTYPE POWERMART SYSTEM \"powrmart.dtd\"> \n");
    header.append("<POWERMART CREATION_DATE=\"11/02/2017 11:12:13\" REPOSITORY_VERSION=\"184.93\"> \n");
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
    var dataTypeS = "";
    var dataLength = "";
    var dataPrecision = "";
    var dataScale = "";

    
/** Iterate over the mapping specifications to get the Source Table Name */    
    for (var i=0;i<tfrms.size();
         i++) 
    {
        if (tfrms.get(i).getInputColumns().size()>0) 
        {

            if (!tfrms.get(i).getInputColumns().get(0).getParentTable().getCompleteName().equals("SYS")) {
                sourceTable = tfrms.get(i).getInputColumns().get(0).getParentTable().getCompleteName();
            }
        }
    }

    sourceTableName = sourceTable.substring(sourceTable.indexOf(".")+1);

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
                    dataTypeS = tfrms.get(j).getInputColumns().get(0).getDataType();
                    dataLength = tfrms.get(j).getInputColumns().get(0).getLength();
                    dataPrecision = tfrms.get(j).getInputColumns().get(0).getPrecision();
                    dataScale = tfrms.get(j).getInputColumns().get(0).getScale();


                    if (dataTypeS.equalsIgnoreCase("date")){
                        dataType = "date";
                        dataLength = "19";
                        dataPrecision = "19";
                    }
                    else if (dataTypeS.equalsIgnoreCase("number")){
                        dataType = "number";
                        dataLength = "15";
                        dataPrecision = "15";
                    }
                    else   {
                        dataType = dataTypeS;
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

    var tgt = new java.lang.StringBuffer();
    var tfrms =  mapping.getTransformations();

    var targetTableName = "";
    var targetTable = "";
    var tgtSchema = "";
    
    var targetColumnName = "";
    var dataTypeT = "";
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

            if (!tfrms.get(i).getOutputColumns().get(0).getParentTable().getCompleteName().equals("SYS")){
                targetTable = tfrms.get(i).getOutputColumns().get(0).getParentTable().getCompleteName();
            }
        }
    }

    targetTableName = targetTable.substring(targetTable.indexOf(".")+1);

    tgt.append("    <TARGET BUSINESSNAME =\"\" CONSTRAINT =\"\" DATABASETYPE =\""+vTargetComponent+"\" DESCRIPTION =\"\" NAME =\"" +targetTableName+ "\" OBJECTVERSION =\"1\" TABLEOPTIONS =\"\" VERSIONNUMBER =\"1\"> \n");


/** Iterate over the mapping specifications to get the Target Columns Details */
    for (var j=0;j<tfrms.size();
         j++)

        if (tfrms.get(j).getOutputColumns().size()>0) {

            if (!tfrms.get(j).getOutputColumns().get(0).getParentTable().getCompleteName().equals("")) {

                targetColumnName = tfrms.get(j).getOutputColumns().get(0).getColumnName();
                dataTypeT = tfrms.get(j).getOutputColumns().get(0).getDataType();
                dataLength = tfrms.get(j).getOutputColumns().get(0).getLength();
                dataPrecision = tfrms.get(j).getOutputColumns().get(0).getPrecision();
                dataScale = tfrms.get(j).getOutputColumns().get(0).getScale();
                targetColumnClass = tfrms.get(j).getOutputColumns().get(0).getColumnClass();

                if (dataTypeT.equalsIgnoreCase("date")){
                    dataType = "date";
                    dataLength = "10";
                    dataPrecision = "10";
                }
                else   {
                    dataType = dataTypeT;
                }


            }

            tgt.append("        <TARGETFIELD BUSINESSNAME =\"\" DATATYPE =\""+dataType+"\" DESCRIPTION =\"\" FIELDNUMBER =\""+(j+1)+"\" KEYTYPE =\"NOT A KEY\" NAME =\""+targetColumnName+"\" NULLABLE =\"NULL\" PICTURETEXT =\"\" PRECISION =\""+dataPrecision+"\" SCALE =\""+dataScale+"\"/>  \n");
        }

    tgt.append("    </TARGET> \n");
    tgt.append("</FOLDER>\n");

    return tgt;

}


/** Function to get the Lookup Table Name from Trans Lookup Condition  */
function getLkpTableName(str){
    var lkpTblName="";

    if(str.split("FROM").length > 1){
        lkpTblName = str.split("FROM")[1].split("WHERE")[0];
        if(lkpTblName.contains(".")){
            lkpTblName = lkpTblName.split(".")[1];
        }
    }
    return lkpTblName;


}


/** Creates Informatica .xml Mapping Details creation point */
function MappingDetails(mappingID){

    var mappingDetailsOut = new java.lang.StringBuffer();
    var conOne = new java.lang.StringBuffer();
    var conTwo = new java.lang.StringBuffer();
    var flwThree = new java.lang.StringBuffer();
    var trnsField = new java.lang.StringBuffer();
    var sqOne = new java.lang.StringBuffer();
    var lkpTrans1 = new java.lang.StringBuffer();
    var lkpIns = new java.lang.StringBuffer();
    var lkpCnc = new java.lang.StringBuffer();

    var mappingObj = vmappingManagerUtil.getMapping(mappingID);

    var tfrms =  mapping.getTransformations();
    
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
    var SrcFilter ="";
    var lookUpOn ="";
    var lookUpSrc ="";
    var lookUpRef ="";
    var transLkpCon ="";
    var lkpTblName ="";
    
    var mapingObj = vmappingManagerUtil.getMapping(map_Id,true);
    

    mappingDetailsOut.append("<FOLDER NAME=\""+vNotSharedFolderName+"\" GROUP=\"\" OWNER=\""+vOwner+"\" SHARED=\"NOTSHARED\" DESCRIPTION=\"\" PERMISSIONS=\"rwx---r--\" UUID=\"3029a2ac-679d-45f9-81d4-6080d23df2f0\"> \n");

    mappingDetailsOut.append("    <MAPPING DESCRIPTION =\"\" ISVALID =\"YES\" NAME =\""+mappingObj.getMappingName()+"\" OBJECTVERSION =\"1\" VERSIONNUMBER =\"1\"> \n");

    
    
/** Iterate over the mapping specifications to get the Source and Target Table Names */

    for (var trans =0 ; trans < mapingObj.getMappingSpecifications().size();
         trans++) {

        var mappingSpecificationRow = mapingObj.getMappingSpecifications().get(trans);
        if (mappingSpecificationRow === null) {
            continue;
        }

        sourceTable = mappingSpecificationRow.getSourceTableName();

        if (sourceTable === null) {
            continue;
        }
        targetTable = mappingSpecificationRow.getTargetTableName();


    }
    targetTableName = "SC_"+targetTable.substring(targetTable.indexOf(".")+1);



    sourceTableName = "SC_"+sourceTable.substring(sourceTable.indexOf(".")+1);


    if(!sqOne.toString().contains("SQ_"+sourceTableName)){
        sqOne.append("        <TRANSFORMATION DESCRIPTION =\"\" NAME =\"SQ_"+sourceTableName+"\" OBJECTVERSION =\"1\" REUSABLE =\"NO\" TYPE =\"Source Qualifier\" VERSIONNUMBER =\"1\"> \n");
    }


/** Iterate over the mapping specifications to get the fields information */
    for (var j =0 ; j < mapingObj.getMappingSpecifications().size();
         j++) {
        var mapSpecificationRow = mapingObj.getMappingSpecifications().get(j);
        if (mapSpecificationRow === null) {
            continue;
        }

        
        sourceColumnName = mapSpecificationRow.getSourceColumnName();

        srcDataType = mapSpecificationRow.getSourceColumnDatatype();

        srcDataLength = mapSpecificationRow.getSourceColumnLength();

        srcDataPrecision = mapSpecificationRow.getSourceColumnPrecision();

        srcDataScale = mapSpecificationRow.getSourceColumnScale();

        if (!mapSpecificationRow.getLookupOn().equals("")){
            lookUpOn = mapSpecificationRow.getLookupOn();
            lookUpSrc = mapSpecificationRow.getSourceColumnName();
        }

        if (!mapSpecificationRow.getLookupColumn().equals("")){
            lookUpRef = mapSpecificationRow.getLookupColumn();
        }

        if (!mapSpecificationRow.getTransformationLookupCondition().equals("")){
            transLkpCon = mapSpecificationRow.getTransformationLookupCondition();
        }

        lkpTblName = getLkpTableName(transLkpCon);



        if (mapSpecificationRow.getSourceColumnClass().equals("LMD")){
            SrcFilter = mapSpecificationRow.getSourceColumnName();
        }


        if (srcDataType.equalsIgnoreCase("number")){
            srcDataType = "decimal";
            srcDataLength = "4";
            srcDataPrecision = "4";
        }


        if (srcDataType.equalsIgnoreCase("DATE")){
            srcDataLength = "29";
            srcDataPrecision = "29";
            srcDataScale = "9";
        }




        if (srcDataType.equalsIgnoreCase("varchar") || srcDataType.equalsIgnoreCase("varchar2") || srcDataType.equalsIgnoreCase("char")|| srcDataType.equalsIgnoreCase("nvarchar2") || srcDataType.equalsIgnoreCase("nchar")){
            srcDataTypeFormat = "string";
        }
        else if (srcDataType.equalsIgnoreCase("timestamp") || srcDataType.equalsIgnoreCase("date") || srcDataType.equalsIgnoreCase("datetime")){
            srcDataTypeFormat = "date/time";
        }
        else if (srcDataType.equalsIgnoreCase("number(p,s)")){
            srcDataTypeFormat = "decimal";
        }
        else if (srcDataType.equalsIgnoreCase("number")){
            srcDataTypeFormat = "decimal";
        }
        else   {
            srcDataTypeFormat = srcDataType;
        }




        sqOne.append("            <TRANSFORMFIELD DATATYPE =\""+srcDataTypeFormat+"\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" NAME =\""+sourceColumnName+"\" PICTURETEXT =\"\" PORTTYPE =\"INPUT/OUTPUT\" PRECISION =\""+srcDataLength+"\" SCALE =\""+srcDataScale+"\"/>  \n");

        conOne.append("        <CONNECTOR FROMFIELD =\""+sourceColumnName+"\" FROMINSTANCE =\""+sourceTableName+"\" FROMINSTANCETYPE =\"Source Definition\" TOFIELD =\""+sourceColumnName+"\" TOINSTANCE =\"SQ_"+sourceTableName+"\" TOINSTANCETYPE =\"Source Qualifier\"/> \n");
        if(mapSpecificationRow.getLookupOn() === ""){
            conTwo.append("        <CONNECTOR FROMFIELD =\""+sourceColumnName+"\" FROMINSTANCE =\"SQ_"+sourceTableName+"\" FROMINSTANCETYPE =\"Source Qualifier\" TOFIELD =\""+sourceColumnName+"\" TOINSTANCE =\""+targetTableName+"_N"+"\" TOINSTANCETYPE =\"Target Definition\"/> \n");
        }

    }




    sqOne.append("            <TABLEATTRIBUTE NAME =\"Sql Query\" VALUE =\"\"/> \n");
    sqOne.append("            <TABLEATTRIBUTE NAME =\"User Defined Join\" VALUE =\"\"/>\n");
    sqOne.append("            <TABLEATTRIBUTE NAME =\"Source Filter\" VALUE =\""+SrcFilter+"&gt;$$CUT_OFF_DATE\"/>\n");
    sqOne.append("            <TABLEATTRIBUTE NAME =\"Number Of Sorted Ports\" VALUE =\"0\"/>\n");
    sqOne.append("            <TABLEATTRIBUTE NAME =\"Tracing Level\" VALUE =\"Normal\"/>\n");
    sqOne.append("            <TABLEATTRIBUTE NAME =\"Select Distinct\" VALUE =\"NO\"/>\n");
    sqOne.append("            <TABLEATTRIBUTE NAME =\"Is Partitionable\" VALUE =\"NO\"/>\n");
    sqOne.append("            <TABLEATTRIBUTE NAME =\"Pre SQL\" VALUE =\"\"/>\n");
    sqOne.append("            <TABLEATTRIBUTE NAME =\"Post SQL\" VALUE =\"\"/>\n");
    sqOne.append("            <TABLEATTRIBUTE NAME =\"Output is deterministic\" VALUE =\"NO\"/>\n");
    sqOne.append("            <TABLEATTRIBUTE NAME =\"Output is repeatable\" VALUE =\"Never\"/>\n");
    sqOne.append("        </TRANSFORMATION>\n");

    
/** It will creates Transformations and Connectors */
    
    if(lookUpOn !== ""){
        lkpTrans1.append("        <TRANSFORMATION DESCRIPTION =\"\" NAME =\"LKPTRANS\" OBJECTVERSION =\"1\" REUSABLE =\"NO\" TYPE =\"Lookup Procedure\" VERSIONNUMBER =\"1\"> \n");
    if(lookUpOn !== lookUpRef){    
        lkpTrans1.append("            <TRANSFORMFIELD DATATYPE =\"double\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" NAME =\""+lookUpOn+"\" PICTURETEXT =\"\" PORTTYPE =\"LOOKUP/OUTPUT\" PRECISION =\"15\" SCALE =\"0\"/>\n");
        lkpTrans1.append("            <TRANSFORMFIELD DATATYPE =\"double\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" NAME =\""+lookUpRef+"\" PICTURETEXT =\"\" PORTTYPE =\"LOOKUP/OUTPUT\" PRECISION =\"15\" SCALE =\"0\"/>\n");
    }
        
    if(lookUpOn == lookUpRef){    
        lkpTrans1.append("            <TRANSFORMFIELD DATATYPE =\"double\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" NAME =\""+lookUpOn+"\" PICTURETEXT =\"\" PORTTYPE =\"LOOKUP/OUTPUT\" PRECISION =\"15\" SCALE =\"0\"/>\n");
    }
        lkpTrans1.append("            <TRANSFORMFIELD DATATYPE =\"double\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" NAME =\"IN_"+lookUpSrc+"\" PICTURETEXT =\"\" PORTTYPE =\"INPUT/OUTPUT\" PRECISION =\"15\" SCALE =\"0\"/>\n");

        lkpTrans1.append("            <TABLEATTRIBUTE NAME =\"Lookup Sql Override\" VALUE =\"\"/>\n");
        lkpTrans1.append("            <TABLEATTRIBUTE NAME =\"Lookup table name\" VALUE =\""+lkpTblName+"\"/>\n");
        lkpTrans1.append("            <TABLEATTRIBUTE NAME =\"Lookup Source Filter\" VALUE =\"\"/>\n");
        lkpTrans1.append("            <TABLEATTRIBUTE NAME =\"Lookup caching enabled\" VALUE =\"YES\"/>\n");
        lkpTrans1.append("            <TABLEATTRIBUTE NAME =\"Lookup policy on multiple match\" VALUE =\"Use Any Value\"/>\n");
        lkpTrans1.append("            <TABLEATTRIBUTE NAME =\"Lookup condition\" VALUE =\""+lookUpOn+" = IN_"+lookUpSrc+"\"/>\n");
        lkpTrans1.append("            <TABLEATTRIBUTE NAME =\"Connection Information\" VALUE =\"$Source\"/>\n");
        lkpTrans1.append("            <TABLEATTRIBUTE NAME =\"Source Type\" VALUE =\"Database\"/>\n");
        lkpTrans1.append("            <TABLEATTRIBUTE NAME =\"Recache if Stale\" VALUE =\"NO\"/>\n");
        lkpTrans1.append("            <TABLEATTRIBUTE NAME =\"Tracing Level\" VALUE =\"Normal\"/>\n");
        lkpTrans1.append("            <TABLEATTRIBUTE NAME =\"Lookup cache directory name\" VALUE =\"$PMCacheDir\"/>\n");
        lkpTrans1.append("            <TABLEATTRIBUTE NAME =\"Lookup cache initialize\" VALUE =\"NO\"/>\n");
        lkpTrans1.append("            <TABLEATTRIBUTE NAME =\"Lookup cache persistent\" VALUE =\"NO\"/>\n");
        lkpTrans1.append("            <TABLEATTRIBUTE NAME =\"Lookup Data Cache Size\" VALUE =\"Auto\"/>\n");
        lkpTrans1.append("            <TABLEATTRIBUTE NAME =\"Lookup Index Cache Size\" VALUE =\"Auto\"/>\n");
        lkpTrans1.append("            <TABLEATTRIBUTE NAME =\"Dynamic Lookup Cache\" VALUE =\"NO\"/>\n");
        lkpTrans1.append("            <TABLEATTRIBUTE NAME =\"Synchronize Dynamic Cache\" VALUE =\"NO\"/>\n");
        lkpTrans1.append("            <TABLEATTRIBUTE NAME =\"Output Old Value On Update\" VALUE =\"NO\"/>\n");
        lkpTrans1.append("            <TABLEATTRIBUTE NAME =\"Update Dynamic Cache Condition\" VALUE =\"TRUE\"/>\n");
        lkpTrans1.append("            <TABLEATTRIBUTE NAME =\"Cache File Name Prefix\" VALUE =\"\"/>\n");
        lkpTrans1.append("            <TABLEATTRIBUTE NAME =\"Re-cache from lookup source\" VALUE =\"NO\"/>\n");
        lkpTrans1.append("            <TABLEATTRIBUTE NAME =\"Insert Else Update\" VALUE =\"NO\"/>\n");
        lkpTrans1.append("            <TABLEATTRIBUTE NAME =\"Update Else Insert\" VALUE =\"NO\"/>\n");
        lkpTrans1.append("            <TABLEATTRIBUTE NAME =\"Datetime Format\" VALUE =\"\"/>\n");
        lkpTrans1.append("            <TABLEATTRIBUTE NAME =\"Thousand Separator\" VALUE =\"None\"/>\n");
        lkpTrans1.append("            <TABLEATTRIBUTE NAME =\"Decimal Separator\" VALUE =\".\"/>\n");
        lkpTrans1.append("            <TABLEATTRIBUTE NAME =\"Case Sensitive String Comparison\" VALUE =\"NO\"/>\n");
        lkpTrans1.append("            <TABLEATTRIBUTE NAME =\"Null ordering\" VALUE =\"Null Is Highest Value\"/>\n");
        lkpTrans1.append("            <TABLEATTRIBUTE NAME =\"Sorted Input\" VALUE =\"NO\"/>\n");
        lkpTrans1.append("            <TABLEATTRIBUTE NAME =\"Lookup source is static\" VALUE =\"NO\"/>\n");
        lkpTrans1.append("            <TABLEATTRIBUTE NAME =\"Pre-build lookup cache\" VALUE =\"Auto\"/>\n");
        lkpTrans1.append("            <TABLEATTRIBUTE NAME =\"Subsecond Precision\" VALUE =\"6\"/>\n");
        lkpTrans1.append("            <METADATAEXTENSION DATATYPE =\"STRING\" DESCRIPTION =\"\" DOMAINNAME =\"User Defined Metadata Domain\" ISCLIENTEDITABLE =\"YES\" ISCLIENTVISIBLE =\"YES\" ISREUSABLE =\"YES\" ISSHAREREAD =\"NO\" ISSHAREWRITE =\"NO\" MAXLENGTH =\"256\" NAME =\"Extension\" VALUE =\"\" VENDORNAME =\"INFORMATICA\"/>\n");
        lkpTrans1.append("        </TRANSFORMATION>\n");


    

    lkpIns.append("        <INSTANCE DESCRIPTION =\"\" NAME =\"LKPTRANS\" REUSABLE =\"NO\" TRANSFORMATION_NAME =\"LKPTRANS\" TRANSFORMATION_TYPE =\"Lookup Procedure\" TYPE =\"TRANSFORMATION\"/>\n");

    lkpCnc.append("        <CONNECTOR FROMFIELD =\""+lookUpRef+"\" FROMINSTANCE =\"LKPTRANS\" FROMINSTANCETYPE =\"Lookup Procedure\" TOFIELD =\""+lookUpRef+"\" TOINSTANCE =\""+targetTableName+"_N"+"\" TOINSTANCETYPE =\"Target Definition\"/>\n");
    lkpCnc.append("        <CONNECTOR FROMFIELD =\""+lookUpSrc+"\" FROMINSTANCE =\"SQ_"+sourceTableName+"\" FROMINSTANCETYPE =\"Source Qualifier\" TOFIELD =\"IN_"+lookUpSrc+"\" TOINSTANCE =\"LKPTRANS\" TOINSTANCETYPE =\"Lookup Procedure\"/>\n");
    }
    
    mappingDetailsOut.append(sqOne);
    
    if(lookUpOn !== ""){
    mappingDetailsOut.append(lkpTrans1);
    }
    
    mappingDetailsOut.append("        <INSTANCE DBDNAME =\""+vSourceDB+"\" DESCRIPTION =\"\" NAME =\""+sourceTableName+"\" TRANSFORMATION_NAME =\""+sourceTableName+"\" TRANSFORMATION_TYPE =\"Source Definition\" TYPE =\"SOURCE\"/> \n");
    mappingDetailsOut.append("        <INSTANCE DESCRIPTION =\"\" NAME =\"SQ_"+sourceTableName+"\" REUSABLE =\"NO\" TRANSFORMATION_NAME =\"SQ_"+sourceTableName+"\" TRANSFORMATION_TYPE =\"Source Qualifier\" TYPE =\"TRANSFORMATION\"> \n");
    mappingDetailsOut.append("            <ASSOCIATED_SOURCE_INSTANCE NAME =\""+sourceTableName+"\"/> \n");
    mappingDetailsOut.append("        </INSTANCE> \n");

    if(vTruncateStage.equals('true')){

        mappingDetailsOut.append("        <INSTANCE DESCRIPTION =\"\" NAME =\""+targetTableName+"_N"+"\" TRANSFORMATION_NAME =\""+targetTableName+"\" TRANSFORMATION_TYPE =\"Target Definition\" TYPE =\"TARGET\"> \n");
        mappingDetailsOut.append("            <TABLEATTRIBUTE NAME =\"Pre SQL\" VALUE =\"DELETE FROM "+vTargetSchema+"."+targetTableName+"\"/> \n");
        mappingDetailsOut.append("        </INSTANCE> \n");
    }
    else{

        mappingDetailsOut.append("        <INSTANCE DESCRIPTION =\"\" NAME =\""+targetTableName+"_N"+"\" TRANSFORMATION_NAME =\""+targetTableName+"\" TRANSFORMATION_TYPE =\"Target Definition\" TYPE =\"TARGET\"/> \n");

    }


    if(lookUpOn !== ""){
    mappingDetailsOut.append(lkpIns);
    mappingDetailsOut.append(lkpCnc);
    }
    mappingDetailsOut.append(conOne);
    mappingDetailsOut.append(conTwo);

    mappingDetailsOut.append("        <TARGETLOADORDER ORDER =\"1\" TARGETINSTANCE =\""+targetTableName+"_N"+"\"/> \n");

    mappingDetailsOut.append("        <MAPPINGVARIABLE AGGFUNCTION =\"MAX\" DATATYPE =\"date/time\" DEFAULTVALUE =\"\" DESCRIPTION =\"\" ISEXPRESSIONVARIABLE =\"NO\" ISPARAM =\"NO\" NAME =\"$$CUT_OFF_DATE\" PRECISION =\"29\" SCALE =\"9\" USERDEFINED =\"YES\"/>\n");

    mappingDetailsOut.append("    </MAPPING> \n");

    var vsourceTableName = sourceTableName.replace("SC_","");
    var vtargetTableName = targetTableName.replace("SC_","");

    mappingDetailsOut.append("    <SHORTCUT COMMENTS =\"\" DBDNAME =\""+vSourceDB+"\" FOLDERNAME =\""+vSharedFolderName+"\" NAME =\""+sourceTableName+"\" OBJECTSUBTYPE =\"Source Definition\" OBJECTTYPE =\"SOURCE\" REFERENCEDDBD =\""+vSourceDB+"\" REFERENCETYPE =\"LOCAL\" REFOBJECTNAME =\""+vsourceTableName+"\" REPOSITORYNAME =\""+vRepo+"\" VERSIONNUMBER =\"1\"/> \n");

    mappingDetailsOut.append("    <SHORTCUT COMMENTS =\"\" FOLDERNAME =\""+vSharedFolderName+"\" NAME =\""+targetTableName+"\" OBJECTSUBTYPE =\"Target Definition\" OBJECTTYPE =\"TARGET\" REFERENCETYPE =\"LOCAL\" REFOBJECTNAME =\""+vtargetTableName+"\" REPOSITORYNAME =\""+vRepo+"\" VERSIONNUMBER =\"1\"/>\n");

    return mappingDetailsOut;



}